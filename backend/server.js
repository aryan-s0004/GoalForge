import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './src/routes/authRoutes.js';
import goalRoutes from './src/routes/goalRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import checkinRoutes from './src/routes/checkinRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { AppError } from './src/utils/AppError.js';
import { dbReady } from './src/utils/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health & readiness
app.get('/api/health', async (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/ready', async (req, res) => {
  await dbReady;
  res.json({ ready: true, uptime: process.uptime() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/approvals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/notifications', notificationRoutes);

// JSON parse error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return next(new AppError('Invalid JSON body', 400));
  }
  next(error);
});

// Global error handler
app.use(errorHandler);

// Wait for DB initialization before starting (if not in a serverless function)
if (!process.env.VERCEL) {
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`GoalForge API running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to initialize database connection:', err);
  });
}

export default app;
