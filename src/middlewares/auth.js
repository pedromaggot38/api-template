import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import AppError from '../utils/appError.js';

export const protect = async (request, reply) => {
  let token;

  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
  } else if (request.cookies && request.cookies.accessToken) {
    token = request.cookies.accessToken;
  }

  if (!token) {
    throw new AppError(
      'Você não está logado. Por favor, faça login para obter acesso.',
      401,
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError(
        'Seu token de acesso expirou. Por favor, renove sua sessão.',
        401,
      );
    }
    throw new AppError('Token inválido. Faça login novamente.', 401);
  }

  const currentUser = await db.user.findUnique({
    where: { id: decoded.id },
  });

  if (!currentUser) {
    throw new AppError('O usuário dono deste token não existe mais.', 401);
  }

  const allowedStatuses = ['active', 'pending'];
  if (!allowedStatuses.includes(currentUser.status)) {
    throw new AppError(
      'Sua conta foi desativada ou banida. Por favor, contate o suporte.',
      403,
    );
  }

  if (currentUser.passwordChangedAt) {
    const changedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10,
    );

    if (decoded.iat < changedTimestamp) {
      throw new AppError(
        'Sua senha foi alterada recentemente. Por favor, faça login novamente.',
        401,
      );
    }
  }

  request.user = currentUser;
};

export const restrictTo = (...roles) => {
  return async (request, reply) => {
    if (!roles.includes(request.user.role)) {
      throw new AppError(
        'Você não tem permissão para realizar esta ação.',
        403,
      );
    }
  };
};
