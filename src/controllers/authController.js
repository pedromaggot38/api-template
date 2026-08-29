import { sanitizeString, normalizeInput } from '../utils/sanitize.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import { resfc } from '../utils/resfc.js';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
  setAccessTokenCookie,
  clearAccessTokenCookie,
} from '../utils/controllers/cookieUtils.js';
import AppError from '../utils/appError.js';

export const checkSystemSetup = async (request, reply) => {
  const isInitialized = await userService.hasAnyRoot();

  return resfc({
    reply,
    code: 200,
    data: {
      initialized: isInitialized,
    },
    message: isInitialized
      ? 'O sistema já possui um usuário root configurado.'
      : 'Sistema virgem. Pronto para configuração inicial.',
  });
};

export const setupFirstRoot = async (request, reply) => {
  const isInitialized = await userService.hasAnyRoot();

  if (isInitialized) {
    throw new AppError('O sistema já possui um usuário root configurado.', 400);
  }

  const { password, passwordConfirm, name, username, email, ...rest } =
    request.body;

  if (password !== passwordConfirm) {
    throw new AppError('As senhas não coincidem.', 400);
  }

  const userData = {
    ...rest,
    password,
    name: sanitizeString(name),
    username: normalizeInput(username),
    email: normalizeInput(email),
  };

  const clientInfo = {
    ip: request.ip,
    device: request.headers['user-agent'] || 'Unknown',
  };

  const rootUser = await userService.createFirstRootUser(userData);

  const { accessToken, refreshToken } =
    await authService.generateNewSessionDirectly(rootUser.id, clientInfo);

  setRefreshTokenCookie(reply, request, refreshToken);
  setAccessTokenCookie(reply, request, accessToken);

  return resfc({
    reply,
    code: 201,
    data: { user: rootUser, accessToken, refreshToken },
    message: 'Sistema inicializado com sucesso! Usuário Root criado.',
  });
};

export const signup = async (request, reply) => {
  const { password, passwordConfirm, name, username, email, ...rest } =
    request.body;

  if (password !== passwordConfirm) {
    throw new AppError('As senhas não coincidem.', 400);
  }

  const userData = {
    ...rest,
    password,
    name: sanitizeString(name),
    username: normalizeInput(username),
    email: normalizeInput(email),
  };

  const clientInfo = {
    ip: request.ip,
    device: request.headers['user-agent'] || 'Unknown',
  };

  const { user, accessToken, refreshToken } = await authService.register(
    userData,
    clientInfo,
  );

  setRefreshTokenCookie(reply, request, refreshToken);
  setAccessTokenCookie(reply, request, accessToken);

  return resfc({
    reply,
    code: 201,
    data: { user, accessToken, refreshToken },
  });
};

export const signin = async (request, reply) => {
  const clientInfo = {
    ip: request.ip,
    device: request.headers['user-agent'] || 'Unknown',
  };

  const username = normalizeInput(request.body.username);
  const { password } = request.body;

  const { user, accessToken, refreshToken } = await authService.authenticate(
    username,
    password,
    clientInfo,
  );

  setRefreshTokenCookie(reply, request, refreshToken);
  setAccessTokenCookie(reply, request, accessToken);

  return resfc({
    reply,
    code: 200,
    data: { user, accessToken, refreshToken },
  });
};

export const signout = async (request, reply) => {
  const incomingRefreshToken =
    request.cookies.refreshToken || request.body.refreshToken;

  await authService.revokeSession(incomingRefreshToken);

  clearRefreshTokenCookie(reply);
  clearAccessTokenCookie(reply);

  return resfc({
    reply,
    code: 200,
    message: 'Sessão encerrada com sucesso.',
  });
};

export const refresh = async (request, reply) => {
  const incomingRefreshToken =
    request.cookies.refreshToken || request.body.refreshToken;

  const { accessToken, user } =
    await authService.refreshSession(incomingRefreshToken);

  setAccessTokenCookie(reply, request, accessToken);

  return resfc({
    reply,
    code: 200,
    data: { user, accessToken },
  });
};

export const forgotPassword = async (request, reply) => {
  const identifier = normalizeInput(request.body.identifier);

  const user =
    await userService.findUserByAnyIdentifierWithoutError(identifier);

  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } else {
    await userService.generateAndSendOtp(user.id, 'PASSWORD_RECOVERY');
  }

  return resfc({
    reply,
    code: 200,
    message:
      'Se os dados informados forem válidos, você receberá um código em seu e-mail.',
  });
};

export const resetPassword = async (request, reply) => {
  const clientInfo = {
    ip: request.ip,
    device: request.headers['user-agent'] || 'Unknown',
  };

  const { token, password, passwordConfirm } = request.body;

  if (password !== passwordConfirm) {
    throw new AppError('As senhas não coincidem.', 400);
  }

  const cleanToken = sanitizeString(token);

  const user = await userService.resetUserPassword({
    token: cleanToken,
    password,
  });

  await authService.invalidateAllUserSessions(user.id);

  const { accessToken, refreshToken } =
    await authService.generateNewSessionDirectly(user.id, clientInfo);

  setRefreshTokenCookie(reply, request, refreshToken);
  setAccessTokenCookie(reply, request, accessToken);

  return resfc({
    reply,
    code: 200,
    message: 'Senha redefinida com sucesso!',
    data: { user, accessToken, refreshToken },
  });
};
