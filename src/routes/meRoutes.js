import express from 'express';
import { protect } from '../middlewares/auth.js';
import * as userController from '../controllers/userController.js';
import validate from '../middlewares/validate.js';
import {
  deactivateMeSchema,
  requestEmailChangeSchema,
  updateMeSchema,
  updateMyPasswordSchema,
  verifyOtpSchema,
} from '../models/userSchema.js';
import { uploadAvatar } from '../config/multer.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(userController.getMe)
  .patch(uploadAvatar, validate(updateMeSchema), userController.updateMe);

router.patch(
  '/password',
  validate(updateMyPasswordSchema),
  userController.updateMyPassword,
);

router
  .route('/activation')
  .post(userController.requestActivationToken)
  .patch(validate(verifyOtpSchema), userController.verifyAccount);

router
  .route('/email')
  .post(validate(requestEmailChangeSchema), userController.updateEmailRequest)
  .patch(validate(verifyOtpSchema), userController.verifyEmailUpdate);

router.patch(
  '/deactivate',
  validate(deactivateMeSchema),
  userController.deactivateMe,
);

export default router;
