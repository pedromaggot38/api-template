import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';

export const register = async (userData) => {
  const newUser = await db.user.create({
    data: userData,
  });

  return { user: newUser };
};

export const authenticate = async (username, password) => {
  const user = await db.user.findUnique({
    where: { username },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Username ou password incorretos', 401);
  }

  const allowedStatuses = ['active', 'pending'];

  if (user.status !== 'active') {
    const messages = {
      banned: 'Sua conta foi banida por violação dos termos.',
      pending: 'Por favor, confirme seu e-mail para acessar.',
      deactivated: 'Esta conta foi desativada.',
    };

    throw new Error(messages[user.status] || 'Acesso negado.');
  }

  return { user };
};
