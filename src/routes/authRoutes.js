import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  setupSchema,
} from '../models/userSchema.js';
import * as authController from '../controllers/authController.js';

const authLimitConfig = {
  rateLimit: {
    max: 8,
    timeWindow: 60 * 60 * 1000,
  },
};

export default async function authRoutes(fastify, options) {
  fastify.get('/setup', authController.checkSystemSetup);

  fastify.post(
    '/setup',
    {
      config: authLimitConfig,
      schema: { body: setupSchema },
    },
    authController.setupFirstRoot,
  );

  fastify.post(
    '/signup',
    {
      config: authLimitConfig,
      schema: { body: registerSchema },
    },
    authController.signup,
  );

  fastify.post(
    '/signin',
    {
      config: authLimitConfig,
      schema: { body: loginSchema },
    },
    authController.signin,
  );

  fastify.post('/refresh', authController.refresh);
  fastify.post('/signout', authController.signout);

  fastify.post(
    '/forgot-password',
    {
      config: authLimitConfig,
      schema: { body: forgotPasswordSchema },
    },
    authController.forgotPassword,
  );

  fastify.post(
    '/reset-password',
    {
      config: authLimitConfig,
      schema: { body: resetPasswordSchema },
    },
    authController.resetPassword,
  );
}
