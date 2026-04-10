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

  const { user, wasUpdated } = await userService.updateUser(
    identifier,
    updateData,
    req.user.role,
    req.user.id,
  );

  return resfc({
    res,
    code: 200,
    data: { user },
    message: wasUpdated ? 'Usuário atualizado com sucesso!' : 'Sem alterações.',
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await userService.getUserByIdentifier(req.user.id);

  return resfc({
    res,
    code: 200,
    data: { user },
    message: 'Perfil recuperado com sucesso',
  });
});

export const updateMe = catchAsync(async (req, res) => {
  const { id: performerId, role: performerRole } = req.user;

  const { user, wasUpdated } = await userService.updateUser(
    performerId,
    req.body,
    performerRole,
    performerId,
  );

  return resfc({
    res,
    code: 200,
    data: { user },
    message: wasUpdated ? 'Perfil atualizado com sucesso!' : 'Sem alterações.',
  });
});

export const updateMyPassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await userService.updateMyPassword(req.user.id, currentPassword, newPassword);

  return resfc({
    res,
    code: 200,
    message: 'Senha alterada com sucesso!',
  });
});

/**
 * Remove permanentemente um usuário do sistema
 * Restrito ao nível Root conforme definido nas rotas e service
 */
export const remove = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  await userService.deleteUser(identifier, req.user.role);

  return res.status(204).json({
    status: 'success',
    data: null,
  });
});
