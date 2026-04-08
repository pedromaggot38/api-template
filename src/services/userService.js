import db from '../config/db.js';
import AppError from '../utils/appError.js';

export const findAllUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { [sortBy]: sortOrder },
    }),
    db.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findUserById = async (id) => {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return user;
};
