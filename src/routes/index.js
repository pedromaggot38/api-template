import express from 'express';
import meRoutes from './meRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/me', meRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
