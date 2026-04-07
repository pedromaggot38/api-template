import express from 'express';
import validate from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../models/userSchema.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', validate(registerSchema), authController.signup);
router.post('/signin', validate(loginSchema), authController.signin);
router.get('/signout', authController.signout);

// router.get('/me');

export default router;
