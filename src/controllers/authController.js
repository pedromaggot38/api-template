import catchAsync from '../utils/catchAsync.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import { resfc } from '../utils/resfc.js';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../utils/controllers/cookieUtils.js';
import AppError from '../utils/appError.js';

export const checkSystemSetup = catchAsync(async (req, res, next) => {
  const isInitialized = await userService.hasAnyUser();

  return resfc({
    res,
    code: 200,
    data: {
      initialized: isInitialized,
    },
    message: isInitialized
      ? 'O sistema já possui um usuário root configurado.'
      : 'Sistema virgem. Pronto para configuração inicial.',
  });
});

export const setupFirstRoot = catchAsync(async (req, res, next) => {
  const isInitialized = await userService.hasAnyUser();

  if (isInitialized) {
    throw new AppError('O sistema já possui um usuário root configurado.', 400);
  }

  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    device: req.headers['user-agent'] || 'Unknown',
  };

  const { passwordConfirm, ...userData } = req.body;

  const rootUser = await userService.createFirstRootUser(userData);

  const { accessToken, refreshToken } =
    await authService.generateNewSessionDirectly(rootUser.id, clientInfo);

  setRefreshTokenCookie(res, req, refreshToken);

  return resfc({
    res,
    code: 201,
    data: {
      user: rootUser,
      accessToken,
      refreshToken,
    },
    message: 'Sistema inicializado com sucesso! Usuário Root criado.',
  });
});

export const signup = catchAsync(async (req, res, next) => {
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    device: req.headers['user-agent'] || 'Unknown',
  };

  const { passwordConfirm, ...userData } = req.body;

  const { user, accessToken, refreshToken } = await authService.register(
    userData,
    clientInfo,
  );

  setRefreshTokenCookie(res, req, refreshToken);

  return resfc({
    res,
    code: 201,
    data: { user, accessToken, refreshToken },
  });
});

export const signin = catchAsync(async (req, res, next) => {
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    device: req.headers['user-agent'] || 'Unknown',
  };

  const { username, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.authenticate(
    username,
    password,
    clientInfo,
  );

  setRefreshTokenCookie(res, req, refreshToken);

  return resfc({
    res,
    code: 200,
    data: { user, accessToken, refreshToken },
  });
});

export const signout = catchAsync(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  await authService.revokeSession(incomingRefreshToken);

  clearRefreshTokenCookie(res);

  return resfc({
    res,
    code: 200,
    message: 'Sessão encerrada com sucesso.',
  });
});

export const refresh = catchAsync(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  const { accessToken, user } =
    await authService.refreshSession(incomingRefreshToken);

  return resfc({
    res,
    code: 200,
    data: { user, accessToken },
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { identifier } = req.body;

  const user =
    await userService.findUserByAnyIdentifierWithoutError(identifier);

  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } else {
    await userService.generateAndSendOtp(user.id, 'PASSWORD_RECOVERY');
  }

  return resfc({
    res,
    code: 200,
    message:
      'Se os dados informados forem válidos, você receberá um código em seu e-mail.',
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    device: req.headers['user-agent'] || 'Unknown',
  };

  const { token, password } = req.body;

  const user = await userService.resetUserPassword({
    token,
    password,
  });

  await authService.invalidateAllUserSessions(user.id);

  const { accessToken, refreshToken } =
    await authService.generateNewSessionDirectly(user.id, clientInfo);

  setRefreshTokenCookie(res, req, refreshToken);

  return resfc({
    res,
    code: 200,
    message: 'Senha redefinida com sucesso!',
    data: { user, accessToken, refreshToken },
  });
});
