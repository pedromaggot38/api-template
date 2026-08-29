import authRoutes from './authRoutes.js';
import meRoutes from './meRoutes.js';
import userRoutes from './userRoutes.js';

export default async function apiRoutes(fastify, options) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(meRoutes, { prefix: '/me' });
  fastify.register(userRoutes, { prefix: '/users' });
}
