import { resfc } from '../utils/resfc.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as userService from '../services/userService.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { users, pagination } = await userService.findAllUsers(req.query);

  return resfc(res, 200, users, null, pagination);
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await userService.findUserById(req.params.id);

  return resfc(res, 200, user);
});

export const updateUser = catchAsync(async (req, res, next) => {});
