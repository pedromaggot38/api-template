import db from '../config/db.js';

export const register = async (userData) => {
  const newUser = await db.user.create({
    data: userData,
  });

  return { user: newUser };
};

export const login = async (username, password) => {
  const user = await db.user.findUnique({
    where: { username },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Username ou password incorretos', 401);
  }

  // Se o campo isActive for utilizado futuramente, a verificação seria feita aqui:
  // if (user.isActive === false) throw new AppError('Conta desativada', 401);

  return { user };
};
