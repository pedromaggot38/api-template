import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshTokenSignature,
} from '../utils/controllers/tokenUtils.js';

const createSession = async (userId, clientInfo) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      device: clientInfo.device,
      ip: clientInfo.ip,
      expiresAt: new Date(
        Date.now() +
          parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN, 10) *
            24 *
            60 *
            60 *
            1000,
      ),
    },
  });

  return { accessToken, refreshToken };
};

export const register = async (userData, clientInfo) => {
  const newUser = await db.user.create({
    data: {
      ...userData,
      passwordChangedAt: null,
    },
  });

  const { accessToken, refreshToken } = await createSession(
    newUser.id,
    clientInfo,
  );

  return { user: newUser, accessToken, refreshToken };
};

export const authenticate = async (username, password, clientInfo) => {
  const user = await db.user.findUnique({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Username ou password incorretos', 401);
  }

  const allowedStatuses = ['active', 'pending'];

  if (!allowedStatuses.includes(user.status)) {
    const messages = {
      // pending: 'Por favor, confirme seu e-mail para acessar.',
      banned: 'Sua conta foi banida por violação dos termos.',
      deactivated: 'Esta conta foi desativada.',
    };

    throw new AppError(messages[user.status] || 'Acesso negado.', 403);
  }

  const { accessToken, refreshToken } = await createSession(
    user.id,
    clientInfo,
  );

  return { user, accessToken, refreshToken };
};

export const refreshSession = async (refreshTokenInput) => {
  if (!refreshTokenInput) {
    throw new AppError(
      'Refresh Token não fornecido. Faça login novamente.',
      401,
    );
  }

  const session = await db.refreshToken.findUnique({
    where: { token: refreshTokenInput },
    include: { user: true },
  });

  if (!session || session.revoked) {
    throw new AppError(
      'Sessão inválida ou revogada. Faça login novamente.',
      401,
    );
  }

  if (session.expiresAt < new Date()) {
    throw new AppError('Sessão expirada. Faça login novamente.', 401);
  }

  verifyRefreshTokenSignature(refreshTokenInput);

  const newAccessToken = signAccessToken(session.userId);

  return { accessToken: newAccessToken, user: session.user };
};

export const revokeSession = async (refreshTokenInput) => {
  if (!refreshTokenInput) return;

  await db.refreshToken.updateMany({
    where: { token: refreshTokenInput },
    data: { revoked: true },
  });
};

export const invalidateAllUserSessions = async (userId) => {
  await db.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });
};

export const generateNewSessionDirectly = async (userId, clientInfo) => {
  return await createSession(userId, clientInfo);
};
