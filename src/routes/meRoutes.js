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

router.post('/request-token', userController.requestAccountVerification);
router.post(
  '/verify-token',
  validate(verifyOtpSchema),
  userController.verifyAccount,
);

router.post(
  '/change-email/request',
  validate(requestEmailChangeSchema),
  userController.requestEmailChange,
);

router.post(
  '/change-email/verify',
  validate(verifyOtpSchema),
  userController.verifyEmailChange,
);
router.patch(
  '/deactivate',
  validate(deactivateMeSchema),
  userController.deactivateMe,
);

export default router;
