import { PrismaClient } from '../generated/prisma-client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis;

async function hashValue(val) {
  if (
    typeof val === 'string' &&
    !val.startsWith('$2a$') &&
    !val.startsWith('$2b$')
  ) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(val, salt);
  }
  return val;
}

async function mutatePassword(data) {
  if (!data) return;
  if (typeof data.password === 'string') {
    data.password = await hashValue(data.password);
  } else if (data.password && typeof data.password.set === 'string') {
    data.password.set = await hashValue(data.password.set);
  }
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const baseClient = new PrismaClient({ adapter });

  return baseClient.$extends({
    name: 'auto-hash-password',
    query: {
      user: {
        async create({ args, query }) {
          await mutatePassword(args.data);
          return query(args);
        },
        async createMany({ args, query }) {
          if (Array.isArray(args.data)) {
            for (const item of args.data) {
              await mutatePassword(item);
            }
          } else {
            await mutatePassword(args.data);
          }
          return query(args);
        },
        async update({ args, query }) {
          await mutatePassword(args.data);
          return query(args);
        },
        async updateMany({ args, query }) {
          await mutatePassword(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          await mutatePassword(args.create);
          await mutatePassword(args.update);
          return query(args);
        },
      },
    },
  });
}

/** @type {ReturnType<typeof createPrismaClient>} */
const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export default db;
