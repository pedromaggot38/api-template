import { resfc } from '../utils/resfc.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as userService from '../services/userService.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { users, pagination } = await userService.findAllUsers(req.query);

  return resfc({
    res,
    code: 200,
    data: { users },
    results: pagination,
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  const user = await userService.getUserByIdentifier(identifier);

  return resfc({
    res,
    code: 200,
    message: 'Usuário recuperado com sucesso',
    data: { user },
  });
});

export const update = catchAsync(async (req, res) => {
  const { identifier } = req.params;
  const updateData = req.body;

  const updatedUser = await userService.updateUser(identifier, updateData);

  return resfc({
    res,
    code: 200,
    data: { user: updatedUser },
    message: 'Usuário atualizado com sucesso',
  });
});
