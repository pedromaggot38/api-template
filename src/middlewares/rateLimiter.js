import { rateLimit } from 'express-rate-limit';
import AppError from '../utils/appError.js';

const createOptionalLimiter = (options) => {
  return rateLimit({
    ...options,
    skip: () => process.env.NODE_ENV !== 'production',
  });
};

export const apiLimiter = createOptionalLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Muitas requisições, tente novamente mais tarde.', 429));
  },
});

export const authLimiter = createOptionalLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Muitas tentativas de login. Tente novamente em uma hora.',
        429,
      ),
    );
  },
});
