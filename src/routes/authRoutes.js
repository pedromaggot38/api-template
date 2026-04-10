import express from 'express';
import validate from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../models/userSchema.js';
import * as authController from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

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
router.get('/signout', authController.signout);

export default router;
