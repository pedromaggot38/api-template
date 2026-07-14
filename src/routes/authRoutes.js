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

router
  .route('/setup')
  .get(authController.checkSystemSetup)
  .post(authLimiter, validate(registerSchema), authController.setupFirstRoot);

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
router.post('/signout', authController.signout);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
