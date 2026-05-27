import { resfc } from '../utils/resfc.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../utils/controllers/cookieUtils.js';
import { deleteFile, getFileUrl } from '../utils/fileUpload.js';
import { validateRoleHierarchy } from '../utils/controllers/userUtils.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { users, pagination } = await userService.findAllUsers(req.query);

  return resfc({
    res,
    code: 200,
    data: { users },
    results: pagination,
  });
});

export const adminCreateUser = catchAsync(async (req, res, next) => {
  const { passwordConfirm, ...newUserData } = req.body;

  const newUser = await userService.createUserByAdmin(
    req.user.id,
    req.user.role,
    newUserData,
  );

  return resfc({
    res,
    code: 201,
    message: `Usuário ${newUser.name} criado com sucesso com o cargo [${newUser.role.toUpperCase()}].`,
    data: { user: newUser },
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

export const deactivateUserByAdmin = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  const targetUser = await userService.findUserByAnyIdentifier(identifier);

  validateRoleHierarchy(req.user.role, targetUser.role);

  await userService.deactivateUserAccount(targetUser.id);

  return resfc({
    res,
    code: 200,
    message: `A conta do usuário ${targetUser.username} foi desativada com sucesso pelo administrador.`,
  });
});

export const deleteUserByAdmin = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  const targetUser = await userService.findUserByAnyIdentifier(identifier);

  await authService.invalidateAllUserSessions(targetUser.id);

  await userService.deleteUser(targetUser.id, req.user.role);

  return resfc({
    res,
    code: 204,
  });
});

// Controllers funcionais para rota /ME

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
  let newFileUrl = null;

  if (req.file) {
    newFileUrl = getFileUrl(req.file, 'avatars');
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
      currentUser.avatar.startsWith('/public/')
    ) {
      deleteFile(currentUser.avatar);
    }
  }

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

export const requestActivationToken = catchAsync(async (req, res) => {
  await userService.generateAndSendOtp(req.user.id, 'ACCOUNT_VERIFICATION');

  return resfc({
    res,
    code: 200,
    message: 'Um novo código de verificação foi enviado para o seu e-mail.',
  });
});

export const verifyAccount = catchAsync(async (req, res) => {
  if (req.user.isVerified) {
    throw new AppError('Esta conta já se encontra ativa e verificada.', 400);
  }

  const { token } = req.body;

  const { user, message } = await userService.verifyOtpCode(
    req.user.id,
    token,
    'ACCOUNT_VERIFICATION',
  );

  return resfc({
    res,
    code: 200,
    data: { user },
    message,
  });
});

export const updateEmailRequest = catchAsync(async (req, res) => {
  const { newEmail } = req.body;

  await userService.generateAndSendOtp(req.user.id, 'EMAIL_CHANGE', {
    newEmail,
  });

  return resfc({
    res,
    code: 200,
    message: `Se o e-mail informado for válido e estiver disponível, um código de confirmação será enviado para ele.`,
  });
});

export const verifyEmailUpdate = catchAsync(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('O código de confirmação é obrigatório.', 400);
  }

  const { user, message } = await userService.verifyOtpCode(
    req.user.id,
    token,
    'EMAIL_CHANGE',
  );

  return resfc({
    res,
    code: 200,
    data: { user },
    message,
  });
});

export const deactivateMe = catchAsync(async (req, res, next) => {
  const { password } = req.body;

  await userService.deactivateUserAccount(req.user.id, password);

  clearRefreshTokenCookie(res);

  return resfc({
    res,
    code: 200,
    message: 'Sua conta foi desativada com sucesso. Sentiremos sua falta!',
  });
});
