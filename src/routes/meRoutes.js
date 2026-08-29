import { protect } from '../middlewares/auth.js';
import * as userController from '../controllers/userController.js';
import {
  deactivateMeSchema,
  requestEmailChangeSchema,
  updateMeSchema,
  updateMyPasswordSchema,
  verifyOtpSchema,
} from '../models/userSchema.js';
import { uploadAvatar } from '../middlewares/uploadAvatar.js';

export default async function meRoutes(fastify, options) {
  fastify.addHook('preHandler', protect);

  fastify.get('/', userController.getMe);

  fastify.patch(
    '/',
    {
      preHandler: [uploadAvatar],
      schema: { body: updateMeSchema },
      validatorCompiler: ({ schema }) => {
        return (data) => {
          if (!data || typeof data !== 'object') {
            return true;
          }

          const isValid = Value.Check(schema, data);
          if (!isValid) {
            const errors = [...Value.Errors(schema, data)];
            return {
              error: new Error(
                errors
                  .map(
                    (e) =>
                      `${e.path.replace('/', '') || 'campo'}: ${e.message}`,
                  )
                  .join(', '),
              ),
            };
          }

          return true;
        };
      },
    },
    userController.updateMe,
  );

  fastify.patch(
    '/password',
    {
      schema: { body: updateMyPasswordSchema },
    },
    userController.updateMyPassword,
  );

  fastify.post('/activation', userController.requestActivationToken);

  fastify.patch(
    '/activation',
    {
      schema: { body: verifyOtpSchema },
    },
    userController.verifyAccount,
  );

  fastify.post(
    '/email',
    {
      schema: { body: requestEmailChangeSchema },
    },
    userController.updateEmailRequest,
  );

  fastify.patch(
    '/email',
    {
      schema: { body: verifyOtpSchema },
    },
    userController.verifyEmailUpdate,
  );

  fastify.patch(
    '/deactivate',
    {
      schema: { body: deactivateMeSchema },
    },
    userController.deactivateMe,
  );
}
