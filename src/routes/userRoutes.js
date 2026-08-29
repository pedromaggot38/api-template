import * as userController from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import {
  adminCreateUserSchema,
  identifierParamSchema,
  updateUserSchema,
} from '../models/userSchema.js';

export default async function userRoutes(fastify, options) {
  fastify.addHook('preHandler', protect);
  fastify.addHook('preHandler', restrictTo('root', 'admin'));

  fastify.get('/', userController.listUsers);

  fastify.post(
    '/',
    {
      schema: { body: adminCreateUserSchema },
    },
    userController.adminCreateUser,
  );

  fastify.get(
    '/:identifier',
    {
      schema: { params: identifierParamSchema },
    },
    userController.getUser,
  );

  fastify.patch(
    '/:identifier',
    {
      schema: {
        params: identifierParamSchema,
        body: updateUserSchema,
      },
    },
    userController.update,
  );

  fastify.delete(
    '/:identifier',
    {
      preHandler: [restrictTo('root')],
      schema: { params: identifierParamSchema },
    },
    userController.deleteUserByAdmin,
  );

  fastify.patch(
    '/:identifier/deactivate',
    {
      schema: { params: identifierParamSchema },
    },
    userController.deactivateUserByAdmin,
  );
}
