import express from 'express';
import { protect } from '../middlewares/auth.js';
import * as userController from '../controllers/userController.js';
import validate from '../middlewares/validate.js';
import {
  updateMeSchema,
  updateMyPasswordSchema,
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

export default router;
