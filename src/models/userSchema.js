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

const passwordConfirmationFields = z.object({
  passwordConfirm: z.string({
    required_error: 'A confirmação de senha é obrigatória.',
  }),
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
  avatar: z.string().url('URL do avatar inválida').optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Telefone inválido')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? sanitizeString(val) : val)),
});

export const adminCreateUserSchema = userBaseFields
  .merge(passwordConfirmationFields)
  .extend({
    role: z.enum(['user', 'admin', 'root'], {
      required_error: 'Defina o cargo do novo usuário.',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

export const registerSchema = userBaseFields
  .merge(passwordConfirmationFields)
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

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
    username: true,
    avatar: true,
    phone: true,
  })
  .partial();

export const updateMyPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: userBaseFields.shape.password,
    passwordConfirm: userBaseFields.shape.password,
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

export const requestEmailChangeSchema = z.object({
  newEmail: z
    .email('Por favor, informe um endereço de e-mail válido.')
    .toLowerCase()
    .trim(),
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
    token: z
      .string()
      .length(6, 'O código deve ter exatamente 6 dígitos')
      .trim()
      .transform(sanitizeString),
    password: userBaseFields.shape.password,
    passwordConfirm: userBaseFields.shape.password,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

export const deactivateMeSchema = z.object({
  password: z
    .string({
      required_error: 'A senha atual é obrigatória para desativar a conta.',
    })
    .min(1, 'Por favor, informe sua senha.'),
});
