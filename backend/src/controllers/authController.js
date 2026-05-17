import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../utils/db.js';
import { AppError } from '../utils/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'goal-forge-secret-key-2026';

/**
 * POST /api/auth/login
 * Email + Password authentication
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email) return next(new AppError('Email is required', 400));
    if (!password) return next(new AppError('Password is required', 400));

    const user = await db.findUserByEmail(email);
    if (!user) return next(new AppError('Invalid email or password', 401));

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return next(new AppError('Invalid email or password', 401));

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Create a new account (for demo extensibility)
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body || {};
    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required', 400));
    }

    const existing = await db.findUserByEmail(email);
    if (existing) return next(new AppError('Email already registered', 409));

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      name,
      email,
      passwordHash,
      role: (role || 'EMPLOYEE').toUpperCase(),
      department: department || 'General',
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user
 */
export const getMe = (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json({
    ...safeUser,
    role: safeUser.role?.toLowerCase(),
  });
};
