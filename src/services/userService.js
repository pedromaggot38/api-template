import db from '../config/db.js';
import AppError from '../utils/appError.js';
import { parseUserIdentifier } from '../utils/controllers/userUtils.js';

const findUserOrThrow = async (identifier) => {
  const where = parseUserIdentifier(identifier);
  const user = await db.user.findUnique({ where });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return user;
};

export const findAllUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const where = {};

  if (role) {
    where.role = role;
  }
  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { username: { contains: search } },
      { email: { contains: search } },
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

export const getUserByIdentifier = async (identifier) => {
  return await findUserOrThrow(identifier);
};

export const updateUser = async (identifier, data) => {
  await findUserOrThrow(identifier);
  const where = parseUserIdentifier(identifier);

  return await db.user.update({
    where,
    data,
  });
};
