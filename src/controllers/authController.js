import catchAsync from '../utils/catchAsync.js';
import * as authService from '../services/authService.js';
import {
  clearLogoutCookie,
  createSendToken,
} from '../utils/controllers/authUtils.js';

export const signup = catchAsync(async (req, res, next) => {
  const { passwordConfirm, ...userData } = req.body;

  const { user } = await authService.register(userData);

  return createSendToken(user, 201, res);
});

export const signin = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  const { user } = await authService.authenticate(username, password);

  return createSendToken(user, 200, res);
});

export const signout = catchAsync(async (req, res, next) => {
  clearLogoutCookie(res);

  return resfc(res, 200, null, 'Logout realizado com sucesso!');
});
