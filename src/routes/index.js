import express from 'express';
import authRoutes from './authRoutes.js';
import usersRoutes from './usersRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;
