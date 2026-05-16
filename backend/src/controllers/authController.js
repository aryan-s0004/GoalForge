import jwt from 'jsonwebtoken';
import { db } from '../utils/db.js';
import { AppError } from '../utils/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'goal-forge-secret-key-2026';

export const login = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return next(new AppError('Email is required', 400));

    const user = await db.findProfileByEmail(email);
    if (!user) return next(new AppError('User not found', 401));

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.full_name } });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req, res) => {
  res.json(req.user);
};
