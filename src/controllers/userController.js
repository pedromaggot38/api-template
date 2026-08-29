import { sanitizeString, normalizeInput } from '../utils/sanitize.js';
import { resfc } from '../utils/resfc.js';
import AppError from '../utils/appError.js';
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../utils/controllers/cookieUtils.js';
import { deleteFile, getFileUrl } from '../utils/fileUpload.js';
import { validateRoleHierarchy } from '../utils/controllers/userUtils.js';

export const listUsers = async (request, reply) => {
  const { users, pagination } = await userService.listUsers(request.query);

  return resfc({
    reply,
    code: 200,
    data: users,
    meta: pagination,
    message: 'Usuários listados com sucesso.',
  });
};

export const adminCreateUser = async (request, reply) => {
  const { password, passwordConfirm, name, username, email, phone, ...rest } =
    request.body;

  if (password !== passwordConfirm) {
    throw new AppError('As senhas não coincidem.', 400);
  }

  const newUserData = {
    ...rest,
    password,
    name: sanitizeString(name),
    username: normalizeInput(username),
    email: normalizeInput(email),
  };

  if (phone) newUserData.phone = sanitizeString(phone);

  const newUser = await userService.createUserByAdmin(
    request.user.id,
    request.user.role,
    newUserData,
  );

  return resfc({
    reply,
    code: 201,
    message: `Usuário ${newUser.name} criado com sucesso com o cargo [${newUser.role.toUpperCase()}].`,
    data: { user: newUser },
  });
};

export const getUser = async (request, reply) => {
  const identifier = normalizeInput(request.params.identifier);

  const user = await userService.findUserByAnyIdentifier(identifier);

  return resfc({
    reply,
    code: 200,
    message: 'Usuário recuperado com sucesso',
    data: { user },
  });
};

export const deactivateUserByAdmin = async (request, reply) => {
  const identifier = normalizeInput(request.params.identifier);
  const targetUser = await userService.findUserByAnyIdentifier(identifier);

  validateRoleHierarchy(request.user.role, targetUser.role);

  await userService.deactivateUserAccount(targetUser.id);

  return resfc({
    reply,
    code: 200,
    message: `A conta do usuário ${targetUser.username} foi desativada com sucesso pelo administrador.`,
  });
};

export const deleteUserByAdmin = async (request, reply) => {
  const identifier = normalizeInput(request.params.identifier);
  const targetUser = await userService.findUserByAnyIdentifier(identifier);

  await authService.invalidateAllUserSessions(targetUser.id);
  await userService.deleteUser(targetUser.id, request.user.role);

  return reply.code(204).send();
};

// Controllers funcionais para rota /ME

export const update = async (request, reply) => {
  const identifier = normalizeInput(request.params.identifier);
  const updateData = { ...request.body };

  if (updateData.name) updateData.name = sanitizeString(updateData.name);
  if (updateData.username)
    updateData.username = normalizeInput(updateData.username);
  if (updateData.email) updateData.email = normalizeInput(updateData.email);
  if (updateData.phone) updateData.phone = sanitizeString(updateData.phone);

  const { user, wasUpdated } = await userService.updateUser(
    identifier,
    updateData,
    request.user.role,
    request.user.id,
  );

  return resfc({
    reply,
    code: 200,
    data: { user },
    message: wasUpdated ? 'Usuário atualizado com sucesso!' : 'Sem alterações.',
  });
};

export const getMe = async (request, reply) => {
  const user = await userService.findUserByAnyIdentifier(request.user.id);

  return resfc({
    reply,
    code: 200,
    data: { user },
    message: 'Perfil recuperado com sucesso',
  });
};

export const updateMe = async (request, reply) => {
  const currentUser = request.user;
  const body = request.body || {};

  const hasUploadedFile = Boolean(request.file && request.file.filename);

  if (Object.keys(body).length === 0 && !hasUploadedFile) {
    throw new AppError('Envie ao menos um campo para atualização.', 400);
  }

  const updateData = { ...body };

  if (updateData.name) updateData.name = sanitizeString(updateData.name);
  if (updateData.username)
    updateData.username = normalizeInput(updateData.username);
  if (updateData.phone) updateData.phone = sanitizeString(updateData.phone);

  let newFileUrl = null;

  // Só gera URL local se houver um arquivo real processado
  if (hasUploadedFile) {
    newFileUrl = getFileUrl(request.file, 'avatars');
    updateData.avatar = newFileUrl;
  }

  const { user, wasUpdated } = await (async () => {
    try {
      return await userService.updateUser(
        currentUser.id,
        updateData,
        currentUser.role,
        currentUser.id,
      );
    } catch (error) {
      if (newFileUrl) {
        deleteFile(newFileUrl);
      }
      throw error;
    }
  })();

  if (wasUpdated) {
    const avatarWasChanged =
      newFileUrl ||
      (updateData.avatar && updateData.avatar !== currentUser.avatar);

    if (
      avatarWasChanged &&
      currentUser.avatar &&
      currentUser.avatar.startsWith('/public/') &&
      currentUser.avatar !== newFileUrl
    ) {
      deleteFile(currentUser.avatar);
    }
  }

  return resfc({
    reply,
    code: 200,
    data: { user },
    message: wasUpdated ? 'Perfil atualizado com sucesso!' : 'Sem alterações.',
  });
};

export const updateMyPassword = async (request, reply) => {
  const clientInfo = {
    ip: request.ip,
    device: request.headers['user-agent'] || 'Unknown',
  };

  const { currentPassword, newPassword, passwordConfirm } = request.body;

  if (newPassword !== passwordConfirm) {
    throw new AppError('As novas senhas não coincidem.', 400);
  }

  await userService.updateMyPassword(
    request.user.id,
    currentPassword,
    newPassword,
  );

  await authService.invalidateAllUserSessions(request.user.id);

  const { accessToken, refreshToken } =
    await authService.generateNewSessionDirectly(request.user.id, clientInfo);

  setRefreshTokenCookie(reply, request, refreshToken);

  return resfc({
    reply,
    code: 200,
    message: 'Senha alterada com sucesso!',
    data: { accessToken, refreshToken },
  });
};

export const requestActivationToken = async (request, reply) => {
  await userService.generateAndSendOtp(request.user.id, 'ACCOUNT_VERIFICATION');

  return resfc({
    reply,
    code: 200,
    message: 'Um novo código de verificação foi enviado para o seu e-mail.',
  });
};

export const verifyAccount = async (request, reply) => {
  if (request.user.isVerified) {
    throw new AppError('Esta conta já se encontra ativa e verificada.', 400);
  }

  const token = sanitizeString(request.body.token);

  const { user, message } = await userService.verifyOtpCode(
    request.user.id,
    token,
    'ACCOUNT_VERIFICATION',
  );

  return resfc({
    reply,
    code: 200,
    data: { user },
    message,
  });
};

export const updateEmailRequest = async (request, reply) => {
  const newEmail = normalizeInput(request.body.newEmail);

  await userService.generateAndSendOtp(request.user.id, 'EMAIL_CHANGE', {
    newEmail,
  });

  return resfc({
    reply,
    code: 200,
    message: `Se o e-mail informado for válido e estiver disponível, um código de confirmação será enviado para ele.`,
  });
};

export const verifyEmailUpdate = async (request, reply) => {
  const token = sanitizeString(request.body.token);

  if (!token) {
    throw new AppError('O código de confirmação é obrigatório.', 400);
  }

  const { user, message } = await userService.verifyOtpCode(
    request.user.id,
    token,
    'EMAIL_CHANGE',
  );

  return resfc({
    reply,
    code: 200,
    data: { user },
    message,
  });
};

export const deactivateMe = async (request, reply) => {
  const { password } = request.body;

  await userService.deactivateUserAccount(request.user.id, password);

  clearRefreshTokenCookie(reply);

  return resfc({
    reply,
    code: 200,
    message: 'Sua conta foi desativada com sucesso. Sentiremos sua falta!',
  });
};
