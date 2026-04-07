import { z } from 'zod';

const RoleEnum = z.enum(['user', 'admin', 'root']);

export const userSchema = z
  .object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    username: z
      .string()
      .min(3, 'O username deve ter pelo menos 3 caracteres')
      .max(20, 'O username deve ter no máximo 20 caracteres'),
    email: z.string().email('Formato de e-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    passwordConfirm: z.string(),
    /*
    avatar: z.string().url('URL do avatar inválida').optional(),
    phone: z.string().optional(),
    */
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const updateMyProfileSchema = z.object({
  name: z.string().min(3).optional(),
  avatar: z.string().url('URL do avatar inválida').optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
});
