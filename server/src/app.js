import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { authRouter } from './routes/authRoutes.js';
import { caseRouter } from './routes/caseRoutes.js';
import { userRouter } from './routes/userRoutes.js';

dotenv.config();

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'src/uploads')));
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/cases', caseRouter);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));

app.use((error, _req, res, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File must be 8MB or smaller' });
  }
  if (error.message === 'Unexpected field') {
    return res.status(422).json({ message: 'Upload field must be named document' });
  }
  console.error(error);
  return res.status(error.status || 500).json({ message: error.message || 'Something went wrong' });
});
