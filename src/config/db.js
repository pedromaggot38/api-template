import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis;

const prismaWithExtensions = new PrismaClient().$extends({
  query: {
    user: {
      async $allOperations({ operation, args, query }) {
        if (['create', 'update'].includes(operation) && args.data?.password) {
          const salt = await bcrypt.genSalt(10);
          args.data.password = await bcrypt.hash(args.data.password, salt);
        }
        return query(args);
      },
    },
  },
});

const db = globalForPrisma.prisma || prismaWithExtensions;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export default db;