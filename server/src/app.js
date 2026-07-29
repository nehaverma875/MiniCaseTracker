import path from 'path';
import compression from 'compression';
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
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'src/uploads'), {
    etag: true,
    immutable: true,
    maxAge: '7d'
  })
);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/cases', caseRouter);

app.use((req, res) =>
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`
  })
);

app.use((error, _req, res, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ code: 'FILE_TOO_LARGE', message: 'File must be 8MB or smaller' });
  }
  if (error.message === 'Unexpected field') {
    return res.status(422).json({ code: 'UPLOAD_FIELD_INVALID', message: 'Upload field must be named document' });
  }
  console.error(error);
  return res.status(error.status || 500).json({
    code: error.code || 'SERVER_ERROR',
    message: error.message || 'Something went wrong'
  });
});
