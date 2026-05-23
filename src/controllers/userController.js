import { resfc } from '../utils/resfc.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';
import { setRefreshTokenCookie } from '../utils/controllers/cookieUtils.js';
import { deleteFile, getFileUrl } from '../utils/fileUpload.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { users, pagination } = await userService.findAllUsers(req.query);

  return resfc({
    res,
    code: 200,
    data: { users },
    results: pagination,
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  const user = await userService.findUserByAnyIdentifier(identifier);

  return resfc({
    res,
    code: 200,
    message: 'Usuário recuperado com sucesso',
    data: { user },
  });
});

export const update = catchAsync(async (req, res) => {
  const { identifier } = req.params;
  const updateData = req.body;

  const { user, wasUpdated } = await userService.updateUser(
    identifier,
    updateData,
    req.user.role,
    req.user.id,
  );

  return resfc({
    res,
    code: 200,
    data: { user },
    message: wasUpdated ? 'Usuário atualizado com sucesso!' : 'Sem alterações.',
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await userService.findUserByAnyIdentifier(req.user.id);

  return resfc({
    res,
    code: 200,
    data: { user },
    message: 'Perfil recuperado com sucesso',
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  const currentUser = req.user;

  if (Object.keys(req.body).length === 0 && !req.file) {
    throw new AppError('Envie ao menos um campo para atualização.', 400);
  }

  const updateData = { ...req.body };

  if (req.file) {
    if (currentUser.avatar && currentUser.avatar.startsWith('/public/')) {
      deleteFile(currentUser.avatar);
    }
    updateData.avatar = getFileUrl(req.file, 'avatars');
  } else if (updateData.avatar && updateData.avatar !== currentUser.avatar) {
    if (currentUser.avatar && currentUser.avatar.startsWith('/public/')) {
      deleteFile(currentUser.avatar);
    }
  }

  const { user, wasUpdated } = await userService.updateUser(
    currentUser.id,
    updateData,
    currentUser.role,
    currentUser.id,
  );

  return resfc({
    res,
    code: 200,
    data: { user },
    message: wasUpdated ? 'Perfil atualizado com sucesso!' : 'Sem alterações.',
  });
});

export const updateMyPassword = catchAsync(async (req, res) => {
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    device: req.headers['user-agent'] || 'Unknown',
  };

  const { currentPassword, newPassword } = req.body;

  await userService.updateMyPassword(req.user.id, currentPassword, newPassword);

  await authService.invalidateAllUserSessions(req.user.id);

  const { accessToken, refreshToken } =
    await authService.generateNewSessionDirectly(req.user.id, clientInfo);

  setRefreshTokenCookie(res, req, refreshToken);

  return resfc({
    res,
    code: 200,
    message: 'Senha alterada com sucesso!',
    data: { accessToken, refreshToken },
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  const targetUser = await userService.findUserByAnyIdentifier(identifier);

  await authService.invalidateAllUserSessions(targetUser.id);

  await userService.deleteUser(targetUser.id, req.user.role);

  return resfc({
    res,
    code: 204,
  });
});

export const requestAccountVerification = catchAsync(async (req, res) => {
  await userService.generateAndSendOtp(req.user.id, 'ACCOUNT_VERIFICATION');

  return resfc({
    res,
    code: 200,
    message: 'Um novo código de verificação foi enviado para o seu e-mail.',
  });
});

export const verifyAccount = catchAsync(async (req, res) => {
  const { token } = req.body;
  const { user, message } = await userService.verifyVerificationUserCode(
    req.user.id,
    token,
  );

  return resfc({
    res,
    code: 200,
    data: { user },
    message,
  });
});

export const requestEmailChange = catchAsync(async (req, res) => {
  const { newEmail } = req.body;

  const emailExists =
    await userService.findUserByAnyIdentifierWithoutError(newEmail);
  if (emailExists) {
    throw new AppError('Este e-mail já está em uso por outro usuário.', 400);
  }

  await userService.generateAndSendOtp(req.user.id, 'EMAIL_CHANGE', {
    newEmail,
  });

  return resfc({
    res,
    code: 200,
    message: `Código de confirmação enviado para ${newEmail}.`,
  });
});

export const verifyEmailChange = catchAsync(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('O código de confirmação é obrigatório.', 400);
  }

  const updatedUser = await userService.confirmEmailChange(req.user.id, token);

  return resfc({
    res,
    code: 200,
    message: 'E-mail atualizado com sucesso!',
    data: { email: updatedUser.email },
  });
});
