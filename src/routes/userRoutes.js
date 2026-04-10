import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { updateUserSchema } from '../models/userSchema.js';

const router = express.Router();

router.use(protect);

router.use(restrictTo('root', 'admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:identifier')
  .get(userController.getUser)
  .patch(validate(updateUserSchema), userController.update)
  .delete(restrictTo('root'), userController.remove);

export default router;
