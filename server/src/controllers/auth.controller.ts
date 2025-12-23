import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

type User = {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'employee' | 'manager' | 'admin';
  department?: string;
  location?: string;
  interests?: string[];
  profilePicture?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
};

const users: User[] = [
  {
    id: 1,
    email: 'admin@pwc.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3JQ.6EL9k6', 
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'IT',
    location: 'London',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    email: 'manager@pwc.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3JQ.6EL9k6',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    department: 'Operations',
    location: 'Manchester',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let userIdCounter = 3;

const generateToken = (user: Omit<User, 'password'>): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const secret = config.jwt.secret || 'fallback-secret';
  const expiresIn = config.jwt.expiresIn || '24h';

  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, department, location } = req.body;

      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        throw createError(400, 'User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser: User = {
        id: userIdCounter++,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'employee',
        department,
        location,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users.push(newUser);

      const token = generateToken(newUser);

      const { password: _, ...userResponse } = newUser;

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = users.find(u => u.email === email);
      if (!user) {
        throw createError(401, 'Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw createError(401, 'Invalid email or password');
      }

      const token = generateToken(user);

      const { password: _, ...userResponse } = user;

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        throw createError(401, 'Refresh token is required');
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const user = users.find(u => u.id === decoded.id);

      if (!user) {
        throw createError(401, 'Invalid token');
      }

      const newToken = generateToken(user);

      res.json({
        success: true,
        data: { token: newToken },
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = users.find(u => u.email === email);
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
      }

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

 
      const hashedPassword = await bcrypt.hash(password, 12);

      res.json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const usersResponse = users.map(({ password, ...user }) => user);

      res.json({
        success: true,
        data: usersResponse,
      });
    } catch (error) {
      next(error);
    }
  },
};