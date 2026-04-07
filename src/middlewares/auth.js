import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'Você não está logado. Por favor, faça login para obter acesso.',
        401,
      ),
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await db.user.findUnique({
    where: { id: decoded.id },
  });

  if (!currentUser) {
    return next(
      new AppError('O usuário dono deste token não existe mais.', 401),
    );
  }

  // Verificar se o usuário está ativo (se você usar o campo isActive)
  // if (!currentUser.isActive) {
  //   return next(new AppError('Este usuário está desativado.', 401));
  // }

  req.user = currentUser;
  next();
});

/**
 * Middleware para restrição por Roles
 * Ex: restrictTo('admin', 'root')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Você não tem permissão para realizar esta ação.', 403),
      );
    }
    next();
  };
};
