import express from 'express';
import { login, loginValidation, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

authRouter.post('/login', loginValidation, login);
authRouter.get('/me', requireAuth, me);
