import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.use(restrictTo('root', 'admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:identifier')
  .get(userController.getUser)
  .patch(userController.update);

export default router;
