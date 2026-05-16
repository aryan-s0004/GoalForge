import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './src/routes/authRoutes.js';
import goalRoutes from './src/routes/goalRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { AppError } from './src/utils/AppError.js';
import { hasSupabase } from './src/utils/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Route specifically for ready checks
app.get('/api/ready', async (req, res) => {
  // Simple check for now, can be expanded to check DB connections
  res.status(200).json({ ready: true, uptime: process.uptime() });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: hasSupabase ? 'supabase' : 'demo' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/approvals', goalRoutes); // We placed approval routes inside goalRoutes
app.use('/api/admin', adminRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return next(new AppError('Invalid JSON body', 400));
  }
  next(error);
});

// Apply global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GoalForge API running on http://localhost:${PORT} (${hasSupabase ? 'Supabase' : 'demo'} mode)`);
});
