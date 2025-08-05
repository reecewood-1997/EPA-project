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

  // If it's our custom AppError
  if ('isOperational' in error && error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // If it's a regular Error object
  const err = error as Error;

  // If it's a validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: err.message,
    });
  }

  // If it's a JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};