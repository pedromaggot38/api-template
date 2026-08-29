import { Type } from '@sinclair/typebox';

const UserRole = Type.Union([
  Type.Literal('user'),
  Type.Literal('admin'),
  Type.Literal('root'),
]);

const UserStatus = Type.Union([
  Type.Literal('pending'),
  Type.Literal('active'),
  Type.Literal('banned'),
  Type.Literal('deactivated'),
]);

export const identifierParamSchema = Type.Object({
  identifier: Type.String({ minLength: 3 }),
});

const passwordConfirmationFields = Type.Object({
  passwordConfirm: Type.String(),
});

const userBaseFields = Type.Object({
  name: Type.String({ minLength: 3 }),
  username: Type.String({ minLength: 3, maxLength: 20 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 4 }),
  avatar: Type.Optional(
    Type.Union([Type.String({ format: 'uri' }), Type.Literal('')]),
  ),
  phone: Type.Optional(
    Type.Union([Type.String({ minLength: 10 }), Type.Literal('')]),
  ),
});

// --- Schemas de Criação Separados para o Swagger ---

export const setupSchema = Type.Intersect(
  [userBaseFields, passwordConfirmationFields],
  {
    examples: [
      {
        name: 'Usuário Root',
        username: 'root',
        email: 'root@root.com',
        password: 'root',
        passwordConfirm: 'root',
      },
    ],
  },
);

export const registerSchema = Type.Intersect(
  [userBaseFields, passwordConfirmationFields],
  {
    examples: [
      {
        name: 'Usuário Padrão',
        username: 'user',
        email: 'user@user.com',
        password: 'user',
        passwordConfirm: 'user',
      },
    ],
  },
);

export const adminCreateUserSchema = Type.Intersect(
  [
    userBaseFields,
    passwordConfirmationFields,
    Type.Object({
      role: UserRole,
    }),
  ],
  {
    examples: [
      {
        name: 'Usuário Administrador',
        username: 'admin',
        email: 'admin@admin.com',
        password: 'admin',
        passwordConfirm: 'admin',
        role: 'admin',
      },
    ],
  },
);

// --- Demais Schemas ---

export const loginSchema = Type.Object(
  {
    username: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 1 }),
  },
  {
    examples: [
      {
        username: 'root',
        password: 'root',
      },
    ],
  },
);

export const updateUserSchema = Type.Partial(
  Type.Intersect([
    Type.Pick(userBaseFields, ['name', 'username', 'email', 'avatar', 'phone']),
    Type.Object({
      role: Type.Optional(UserRole),
      status: Type.Optional(UserStatus),
    }),
  ]),
  {
    examples: [
      {
        name: 'Nome Atualizado',
        role: 'admin',
        status: 'active',
      },
    ],
  },
);

export const updateMeSchema = Type.Partial(
  Type.Pick(userBaseFields, ['name', 'username', 'avatar', 'phone']),
  {
    examples: [
      {
        name: 'Meu Novo Nome',
        phone: '11999999999',
      },
    ],
  },
);

export const updateMyPasswordSchema = Type.Object(
  {
    currentPassword: Type.String({ minLength: 1 }),
    newPassword: Type.String({ minLength: 4 }),
    passwordConfirm: Type.String({ minLength: 4 }),
  },
  {
    examples: [
      {
        currentPassword: 'senha_atual',
        newPassword: 'nova_senha123',
        passwordConfirm: 'nova_senha123',
      },
    ],
  },
);

export const requestEmailChangeSchema = Type.Object(
  {
    newEmail: Type.String({ format: 'email' }),
  },
  {
    examples: [
      {
        newEmail: 'novo_email@novo.com',
      },
    ],
  },
);

export const verifyOtpSchema = Type.Object(
  {
    token: Type.String({ minLength: 6, maxLength: 6 }),
  },
  {
    examples: [
      {
        token: '123456',
      },
    ],
  },
);

export const forgotPasswordSchema = Type.Object(
  {
    identifier: Type.String({ minLength: 1 }),
  },
  {
    examples: [
      {
        identifier: 'root',
      },
    ],
  },
);

export const resetPasswordSchema = Type.Object(
  {
    token: Type.String({ minLength: 6, maxLength: 6 }),
    password: Type.String({ minLength: 4 }),
    passwordConfirm: Type.String({ minLength: 4 }),
  },
  {
    examples: [
      {
        token: '123456',
        password: 'nova_senha123',
        passwordConfirm: 'nova_senha123',
      },
    ],
  },
);

export const deactivateMeSchema = Type.Object(
  {
    password: Type.String({ minLength: 1 }),
  },
  {
    examples: [
      {
        password: 'senha_atual_para_desativar',
      },
    ],
  },
);
