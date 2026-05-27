import db from '../config/db.js';
import AppError from '../utils/appError.js';
import {
  parseUserIdentifier,
  validateRoleHierarchy,
} from '../utils/controllers/userUtils.js';
import bcrypt from 'bcryptjs';
import { generateOtp } from '../utils/generateOtp.js';
import { sendEmail } from '../utils/emailService.js';
import { emailTemplates } from '../templates/emailTemplates.js';
import logger from '../utils/logger.js';
import { invalidateAllUserSessions } from './authService.js';

export const hasAnyUser = async () => {
  const count = await db.user.count();
  return count > 0;
};

const findUserOrThrow = async (identifier) => {
  const where = parseUserIdentifier(identifier);
  const user = await db.user.findUnique({ where });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return user;
};

export const findUserByAnyIdentifier = async (identifier) => {
  return await findUserOrThrow(identifier);
};

export const findUserByAnyIdentifierWithoutError = async (identifier) => {
  const where = parseUserIdentifier(identifier);
  const user = await db.user.findUnique({ where });

  return user;
};

/**
 * Cria o primeiro usuário do sistema obrigatoriamente como 'root'
 * @param {Object} userData - Dados do usuário (username, email, password, etc)
 */
export const createFirstRootUser = async (userData) => {
  const systemHasOwner = await hasAnyUser();

  if (systemHasOwner) {
    throw new AppError(
      'O sistema já foi inicializado. Use o fluxo padrão de cadastro.',
      400,
    );
  }

  const firstRoot = await db.user.create({
    data: {
      ...userData,
      role: 'root',
      passwordChangedAt: null,
    },
  });

  return firstRoot;
};

export const createUserByAdmin = async (
  performerId,
  performerRole,
  userData,
) => {
  validateRoleHierarchy(performerRole, userData.role);

  const emailExists = await findUserByAnyIdentifierWithoutError(userData.email);
  if (emailExists) throw new AppError('Este e-mail já está em uso.', 400);

  const usernameExists = await findUserByAnyIdentifierWithoutError(
    userData.username,
  );
  if (usernameExists) throw new AppError('Este username já está em uso.', 400);

  return await db.user.create({
    data: {
      ...userData,
      passwordChangedAt: null,
    },
  });
};

export const findAllUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const allowedSortFields = [
    'createdAt',
    'name',
    'username',
    'email',
    'status',
    'role',
  ];
  const validatedSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : 'createdAt';
  const validatedSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'desc';

  const validatedLimit = Math.max(1, Number(limit));
  const validatedPage = Math.max(1, Number(page));
  const skip = (validatedPage - 1) * validatedLimit;

  const where = {};

  if (role) {
    where.role = role;
  }
  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { username: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy: { [validatedSortBy]: validatedSortOrder },
    }),
    db.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page: validatedPage,
      limit: validatedLimit,
      totalPages: Math.ceil(total / validatedLimit),
    },
  };
};

export const updateUser = async (
  identifier,
  data,
  performerRole,
  performerId,
) => {
  const currentUser = await findUserOrThrow(identifier);

  if (currentUser.id !== performerId) {
    validateRoleHierarchy(performerRole, currentUser.role);
  }

  const changes = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== currentUser[key]) {
      changes[key] = data[key];
    }
  });

  if (currentUser.role === 'root' && changes.role) {
    throw new AppError(
      'Não é permitido alterar ou reduzir os privilégios de uma conta de nível ROOT.',
      403,
    );
  }

  const hasChanges = Object.keys(changes).length > 0;

  if (!hasChanges) {
    return { user: currentUser, wasUpdated: false };
  }

  const where = parseUserIdentifier(identifier);
  const updatedUser = await db.user.update({
    where,
    data: changes,
  });

  return { user: updatedUser, wasUpdated: true };
};

export const deleteUser = async (identifier, performerRole) => {
  const targetUser = await findUserOrThrow(identifier);

  if (performerRole !== 'root') {
    throw new AppError(
      'Apenas o nível Root pode apagar registros permanentemente.',
      403,
    );
  }

  if (targetUser.role === 'root') {
    throw new AppError(
      'Não é permitido remover usuários com nível de acesso Root.',
      403,
    );
  }

  validateRoleHierarchy(performerRole, targetUser.role);

  return await db.user.delete({
    where: { id: targetUser.id },
  });
};

export const updateMyPassword = async (
  userId,
  currentPassword,
  newPassword,
) => {
  const user = await findUserOrThrow(userId);

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isPasswordCorrect) {
    throw new AppError('A senha atual está incorreta', 401);
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError('A nova senha não pode ser igual à senha atual', 400);
  }

  return await db.user.update({
    where: { id: userId },
    data: {
      password: newPassword,
      passwordChangedAt: new Date(),
    },
  });
};

export const generateAndSendOtp = async (userId, reason, options = {}) => {
  const user = await findUserOrThrow(userId);

  if (reason === 'EMAIL_CHANGE') {
    if (!options.newEmail) {
      throw new AppError('O novo e-mail é obrigatório para este fluxo.', 400);
    }

    if (options.newEmail === user.email) {
      throw new AppError(
        'O novo e-mail não pode ser igual ao e-mail atual da sua conta.',
        400,
      );
    }

    const emailExists = await findUserByAnyIdentifierWithoutError(
      options.newEmail,
    );
    if (emailExists) {
      return true;
    }
  }

  const otp = generateOtp();
  let expires;
  const updateData = {};

  if (reason === 'ACCOUNT_VERIFICATION') {
    expires = new Date(Date.now() + 10 * 60 * 1000);
    updateData.verifyToken = otp;
    updateData.verifyExpires = expires;
  } else if (reason === 'PASSWORD_RECOVERY') {
    expires = new Date(Date.now() + 5 * 60 * 1000);
    updateData.resetToken = otp;
    updateData.resetExpires = expires;
  } else if (reason === 'EMAIL_CHANGE') {
    expires = new Date(Date.now() + 10 * 60 * 1000);
    updateData.changeEmailToken = otp;
    updateData.changeEmailExpires = expires;
    updateData.newEmail = options.newEmail;
  }

  await db.user.update({
    where: { id: userId },
    data: updateData,
  });

  const targetEmail = reason === 'EMAIL_CHANGE' ? options.newEmail : user.email;
  const { subject, html } = emailTemplates[reason]({
    token: otp,
    name: user.name,
  });

  console.log(`[OTP GENERATED] User: ${user.username} | Code: ${otp}`);

  if (reason === 'PASSWORD_RECOVERY' || reason === 'EMAIL_CHANGE') {
    try {
      await sendEmail({ to: targetEmail, subject, html });
    } catch (error) {
      logger.error(
        `[SMTP-FORGOT] Falha mascarada no envio de recuperação para ${targetEmail}`,
      );
    }
  } else {
    await sendEmail({ to: targetEmail, subject, html });
  }

  return true;
};

export const verifyOtpCode = async (userId, token, reason) => {
  const user = await findUserOrThrow(userId);

  const reasonConfig = {
    ACCOUNT_VERIFICATION: {
      tokenField: 'verifyToken',
      expiresField: 'verifyExpires',
      errorMessage: 'Código de ativação inválido ou expirado.',
      successMessage: 'Conta ativada e verificada com sucesso!',
      updateData: {
        verifyToken: null,
        verifyExpires: null,
        isVerified: true,
        status: 'active',
      },
    },
    EMAIL_CHANGE: {
      tokenField: 'changeEmailToken',
      expiresField: 'changeEmailExpires',
      errorMessage: 'Código de confirmação de e-mail inválido ou expirado.',
      successMessage: 'E-mail atualizado e verificado com sucesso!',
      updateData: {
        email: user.newEmail,
        newEmail: null,
        status: 'active',
        isVerified: true,
        verifyToken: null,
        verifyExpires: null,
        changeEmailToken: null,
        changeEmailExpires: null,
      },
    },
  };

  const config = reasonConfig[reason];

  if (!config) {
    throw new AppError('Ação de verificação não suportada pelo sistema.', 400);
  }

  const dbToken = user[config.tokenField];
  const dbExpires = user[config.expiresField];

  if (!dbToken || dbToken !== token || dbExpires < new Date()) {
    throw new AppError(config.errorMessage, 400);
  }

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: config.updateData,
  });

  return {
    user: updatedUser,
    message: config.successMessage,
  };
};

export const resetUserPassword = async ({ token, password }) => {
  const user = await db.user.findFirst({
    where: {
      resetToken: token,
      resetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Código de recuperação inválido ou expirado.', 400);
  }

  const isSamePassword = await bcrypt.compare(password, user.password);

  if (isSamePassword) {
    throw new AppError(
      'A nova senha não pode ser idêntica à senha atual da sua conta.',
      400,
    );
  }

  return await db.user.update({
    where: { id: user.id },
    data: {
      password: password,
      resetToken: null,
      resetExpires: null,
      passwordChangedAt: new Date(),
    },
  });
};

/**
 * Desativa a conta de um usuário alterando o status para 'deactivated'
 * @param {string} userId - ID do usuário a ser desativado
 * @param {string} [currentPassword] - Senha atual (obrigatória apenas se a requisição partir do próprio usuário)
 */
export const deactivateUserAccount = async (userId, currentPassword = null) => {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  if (user.role === 'root') {
    throw new AppError(
      'A conta root do sistema não pode ser desativada para evitar o bloqueio total da plataforma.',
      403,
    );
  }

  if (currentPassword) {
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new AppError(
        'Senha incorreta. Confirme seus dados para desativar a conta.',
        401,
      );
    }
  }

  return await db.$transaction(async (tx) => {
    await invalidateAllUserSessions(userId, tx);

    return await tx.user.update({
      where: { id: userId },
      data: { status: 'deactivated' },
    });
  });
};
