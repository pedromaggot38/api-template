import xss from 'xss';
import { z } from 'zod';

const UserRole = z.enum(['user', 'admin', 'root']);
const UserStatus = z.enum(['pending', 'active', 'banned', 'deactivated']);

const normalizeInput = (val) => val.trim().toLowerCase();

const sanitizeString = (val) => xss(val.trim());

export const identifierParamSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Identificador inválido (UUID ou Username)')
    .transform(sanitizeString),
});

const userBaseFields = z.object({
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .transform(sanitizeString),
  username: z
    .string()
    .min(3, 'O username deve ter pelo menos 3 caracteres')
    .max(20, 'O username deve ter no máximo 20 caracteres')
    .transform((val) => normalizeInput(sanitizeString(val))),
  email: z
    .string()
    .email('Formato de e-mail inválido')
    .transform((val) => normalizeInput(sanitizeString(val))),
  password: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres'),
  passwordConfirm: z.string(),
  avatar: z.string().url('URL do avatar inválida').optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Telefone inválido')
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
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
    .transform((val) => normalizeInput(sanitizeString(val))),
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

export const verifyOtpSchema = z.object({
  token: z
    .string()
    .length(6, 'O código deve ter exatamente 6 dígitos')
    .trim()
    .transform(sanitizeString),
});

export const forgotPasswordSchema = z.object({
  identifier: z
    .string({ required_error: 'E-mail ou usuário é obrigatório' })
    .trim()
    .min(1, 'O identificador não pode estar vazio')
    .transform(sanitizeString),
});

export const resetPasswordSchema = z
  .object({
    identifier: z
      .string({ required_error: 'O identificador é necessário' })
      .trim()
      .min(1)
      .transform(sanitizeString),
    token: z
      .string()
      .length(6, 'O código deve ter exatamente 6 dígitos')
      .trim()
      .transform(sanitizeString),
    password: userBaseFields.shape.password,
    passwordConfirm: userBaseFields.shape.passwordConfirm,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });
