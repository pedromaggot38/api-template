import { z } from 'zod';

const UserRole = z.enum(['user', 'admin', 'root']);
const UserStatus = z.enum(['pending', 'active', 'banned', 'deactivated']);

const normalizeInput = (val) => val.trim().toLowerCase();

export const identifierParamSchema = z.object({
  identifier: z.string().min(3, 'Identificador inválido (UUID ou Username)'),
});

const userBaseFields = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  username: z
    .string()
    .min(3, 'O username deve ter pelo menos 3 caracteres')
    .max(20, 'O username deve ter no máximo 20 caracteres')
    .transform(normalizeInput),
  email: z
    .string()
    .email('Formato de e-mail inválido')
    .transform(normalizeInput),
  password: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres'),
  passwordConfirm: z.string(),
  avatar: z.string().url('URL do avatar inválida').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone inválido').optional(),
});

export const registerSchema = userBaseFields.refine(
  (data) => data.password === data.passwordConfirm,
  {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  },
);

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username é obrigatório')
    .transform(normalizeInput),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const updateUserSchema = userBaseFields
  .pick({
    name: true,
    username: true,
    email: true,
    avatar: true,
    phone: true,
  })
  .extend({
    role: UserRole.optional(),
    status: UserStatus.optional(),
  })
  .partial();

export const updateMeSchema = userBaseFields
  .pick({
    name: true,
    email: true,
    username: true,
    avatar: true,
    phone: true,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Envie ao menos um campo');

export const updateMyPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(4, 'A nova senha deve ter pelo menos 4 caracteres'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });
