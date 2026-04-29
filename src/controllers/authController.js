import catchAsync from '../utils/catchAsync.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import {
  clearLogoutCookie,
  createSendToken,
} from '../utils/controllers/authUtils.js';
import { resfc } from '../utils/resfc.js';

export const signup = catchAsync(async (req, res, next) => {
  const { passwordConfirm, ...userData } = req.body;

  const { user } = await authService.register(userData, req.ip);

  return createSendToken(user, 201, res);
});

export const signin = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  const { user } = await authService.authenticate(username, password, req.ip);

  return createSendToken(user, 200, res);
});

export const signout = catchAsync(async (req, res, next) => {
  clearLogoutCookie(res);

  return resfc({
    res,
    code: 200,
    message: 'Logout realizado com sucesso!',
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

  resfc({
    res,
    code: 200,
    message:
      'Se os dados informados forem válidos, você receberá um código em seu e-mail.',
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { identifier, token, password } = req.body;

  await userService.resetUserPassword({
    identifier,
    token,
    password,
  });

  return resfc({
    res,
    code: 200,
    message: 'Senha redefinida com sucesso!',
  });
});
