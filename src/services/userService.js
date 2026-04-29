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

const findUserOrThrow = async (identifier) => {
  const where = parseUserIdentifier(identifier);
  const user = await db.user.findUnique({ where });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return user;
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

export const findUserByAnyIdentifier = async (identifier) => {
  return await findUserOrThrow(identifier);
};

// Usado na rota de Esqueci Minha Senha
export const findUserByAnyIdentifierWithoutError = async (identifier) => {
  const where = parseUserIdentifier(identifier);
  const user = await db.user.findUnique({ where });

  return user;
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

  const isSameAsOld = await bcrypt.compare(newPassword, user.password);

  if (isSameAsOld) {
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

export const generateAndSendOtp = async (userId, reason) => {
  const user = await findUserOrThrow(userId);
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
  }

  await db.user.update({
    where: { id: userId },
    data: updateData,
  });

  const { subject, html } = emailTemplates[reason]({
    token: otp,
    name: user.name,
  });

  console.log(otp);

  if (reason === 'PASSWORD_RECOVERY') {
    try {
      await sendEmail({ to: user.email, subject, html });
    } catch (error) {
      logger.error(`Erro crítico no reset de senha para ${user.email}:`, error);
      throw new AppError(
        'Erro ao enviar e-mail de recuperação. Tente novamente.',
        500,
      );
    }
  } else {
    sendEmail({ to: user.email, subject, html }).catch((err) => {
      logger.error(
        `Falha silenciosa no e-mail de verificação (${user.email}):`,
        err,
      );
    });
  }

  return true;
};

export const verifyVerificationUserCode = async (userId, token) => {
  const user = await findUserOrThrow(userId);

  if (
    !user.verifyToken ||
    user.verifyToken !== token ||
    user.verifyExpires < new Date()
  ) {
    throw new AppError('Código de verificação inválido ou expirado', 400);
  }

  const updateData = {
    isVerified: true,
    verifyToken: null,
    verifyExpires: null,
    status: 'active',
  };

  let message = 'Conta verificada com sucesso!';

  if (user.newEmail) {
    updateData.email = user.newEmail;
    updateData.newEmail = null;
    message = 'E-mail atualizado e verificado com sucesso!';
  }

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return { user: updatedUser, message };
};

export const resetUserPassword = async ({ identifier, token, password }) => {
  const user = await findUserByAnyIdentifierWithoutError(identifier);

  if (
    !user ||
    !user.resetToken ||
    user.resetToken !== token ||
    user.resetExpires < new Date()
  ) {
    throw new AppError('Código de recuperação inválido ou expirado.', 400);
  }

  return await db.user.update({
    where: { id: user.id },
    data: {
      password,
      resetToken: null,
      resetExpires: null,
      passwordChangedAt: new Date(),
    },
  });
};
