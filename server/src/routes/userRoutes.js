import express from 'express';
import { listAgents } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const userRouter = express.Router();

userRouter.get('/agents', requireAuth, requireRole('manager'), listAgents);
