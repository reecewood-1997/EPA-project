import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export type AppError = {
  statusCode: number;
  message: string;
  isOperational: boolean;
};

export const createError = (statusCode: number, message: string): AppError => ({
  statusCode,
  message,
  isOperational: true,
});

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', error);

  if ('isOperational' in error && error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  const err = error as Error;

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: err.message,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};