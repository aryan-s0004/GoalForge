import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (statusCode === 500) {
    console.error(JSON.stringify({
      level: 'error',
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }));
  }

  res.status(statusCode).json({
    error: err.isOperational ? message : 'Internal server error'
  });
};
