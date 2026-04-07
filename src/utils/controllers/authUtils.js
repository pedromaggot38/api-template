import jwt from 'jsonwebtoken';
import { resfc } from '../resfc.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

export const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const cookieExpiresInDays = process.env.JWT_COOKIE_EXPIRES_IN || 90;
  const expires = new Date(
    Date.now() + cookieExpiresInDays * 24 * 60 * 60 * 1000,
  );

  const cookieOptions = {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  const userResponse = { ...user };
  delete userResponse.password;
  // Se tiver o campo isActive ou outros internos, pode remover aqui também
  // delete userResponse.isActive;

  return resfc(res, statusCode, { user: userResponse, token });
};

export const clearLogoutCookie = (res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    // secure: true // Ative se estiver em produção
  });
};
