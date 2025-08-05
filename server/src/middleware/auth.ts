import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

export type AuthRequest = Request & {
  user?: {
    id: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No user information.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  next();
};

export const managerOrAdminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No user information.' });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Manager or Admin role required.' });
  }

  next();
};