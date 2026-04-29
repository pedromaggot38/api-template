import express from 'express';
import { protect } from '../middlewares/auth.js';
import * as userController from '../controllers/userController.js';
import validate from '../middlewares/validate.js';
import {
  updateMeSchema,
  updateMyPasswordSchema,
  verifyOtpSchema,
} from '../models/userSchema.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(userController.getMe)
  .patch(validate(updateMeSchema), userController.updateMe);

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

router.post('/change-email/request', userController.requestEmailChange);
router.post('/change-email/verify', userController.verifyEmailChange);

export default router;
