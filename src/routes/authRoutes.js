import express from 'express';
import validate from '../middlewares/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../models/userSchema.js';
import * as authController from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/setup/status', authController.checkSystemSetup);
router.post('/setup/root', authLimiter, authController.setupFirstRoot);

router.post(
  '/signup',
  authLimiter,
  validate(registerSchema),
  authController.signup,
);

router.post(
  '/signin',
  authLimiter,
  validate(loginSchema),
  authController.signin,
);

router.post('/refresh', authController.refresh);
router.get('/signout', authController.signout);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
