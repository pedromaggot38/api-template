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

  const user = await userService.findUserByAnyIdentifier(identifier);

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
  const user = await userService.findUserByAnyIdentifier(req.user.id);

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

  return resfc({
    res,
    code: 204,
  });
});

export const requestAccountVerification = catchAsync(async (req, res) => {
  await userService.generateAndSendOtp(req.user.id, 'ACCOUNT_VERIFICATION');

  return resfc({
    res,
    code: 200,
    message: 'Um novo código de verificação foi enviado para o seu e-mail.',
  });
});

export const verifyAccount = catchAsync(async (req, res) => {
  const { token } = req.body;
  const { user, message } = await userService.verifyVerificationUserCode(
    req.user.id,
    token,
  );

  resfc({
    res,
    code: 200,
    data: { user },
    message,
  });
});
