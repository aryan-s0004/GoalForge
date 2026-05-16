import jwt from 'jsonwebtoken';
import { db } from '../utils/db.js';
import { AppError } from '../utils/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'goal-forge-secret-key-2026';

export const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('No token provided', 401));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findProfileById(decoded.userId);
    if (!user) return next(new AppError('Invalid token', 401));
    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return next(new AppError(`Unauthorized: requires ${role} role`, 403));
  }
  next();
};

export const canReviewGoal = async (user, goal) => {
  if (!goal) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'manager') return false;
  const owner = await db.findProfileById(goal.user_id);
  return owner?.manager_id === user.id;
};
