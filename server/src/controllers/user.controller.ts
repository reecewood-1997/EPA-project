import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

// Import users from auth controller (in real app, this would be from database)
// For now, we'll create a simple user service

export type UserProfile = {
  id: number;
  email: string;
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
  isActive: boolean;
};

// Mock user data (replace with database)
const users: UserProfile[] = [
  {
    id: 1,
    email: 'admin@pwc.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'IT',
    location: 'London',
    interests: ['technology', 'community'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  },
  {
    id: 2,
    email: 'manager@pwc.com',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    department: 'Operations',
    location: 'Manchester',
    interests: ['leadership', 'environment'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  },
];

export const userController = {
  // GET /api/users - Get all users (admin only)
  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw createError(403, 'Admin access required');
      }

      const { department, location, role, active = 'true' } = req.query;

      let filteredUsers = users.filter(user => user.isActive === (active === 'true'));

      if (department) {
        filteredUsers = filteredUsers.filter(user => user.department === department);
      }
      if (location) {
        filteredUsers = filteredUsers.filter(user => user.location === location);
      }
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }

      res.json({
        success: true,
        data: filteredUsers,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/:id - Get user by ID
  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const userId = parseInt(id);
      
      // Users can view their own profile, admins can view any profile
      if (req.user.id !== userId && req.user.role !== 'admin') {
        throw createError(403, 'You can only view your own profile');
      }

      const user = users.find(u => u.id === userId);
      if (!user) {
        throw createError(404, 'User not found');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/:id - Update user profile
  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const userId = parseInt(id);
      
      // Users can update their own profile, admins can update any profile
      if (req.user.id !== userId && req.user.role !== 'admin') {
        throw createError(403, 'You can only update your own profile');
      }

      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw createError(404, 'User not found');
      }

      const { role, ...updateData } = req.body;

      // Only admins can change roles
      const roleUpdate = (req.user.role === 'admin' && role) ? { role } : {};

      const updatedUser: UserProfile = {
        ...users[userIndex],
        ...updateData,
        ...roleUpdate,
        updatedAt: new Date(),
      };

      users[userIndex] = updatedUser;

      logger.info(`User profile updated: ${updatedUser.email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/users/:id - Deactivate user (admin only)
  async deactivateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw createError(403, 'Admin access required');
      }

      const { id } = req.params;
      const userId = parseInt(id);

      // Prevent admin from deactivating themselves
      if (req.user.id === userId) {
        throw createError(400, 'You cannot deactivate your own account');
      }

      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw createError(404, 'User not found');
      }

      users[userIndex].isActive = false;
      users[userIndex].updatedAt = new Date();

      logger.info(`User deactivated: ${users[userIndex].email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/users/:id/activate - Reactivate user (admin only)
  async activateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw createError(403, 'Admin access required');
      }

      const { id } = req.params;
      const userId = parseInt(id);

      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw createError(404, 'User not found');
      }

      users[userIndex].isActive = true;
      users[userIndex].updatedAt = new Date();

      logger.info(`User activated: ${users[userIndex].email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/colleagues - Get colleagues for invitations
  async getColleagues(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { search, department, limit = '20' } = req.query;

      let colleagues = users.filter(user => 
        user.id !== req.user!.id && user.isActive
      );

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        colleagues = colleagues.filter(user =>
          user.firstName.toLowerCase().includes(searchTerm) ||
          user.lastName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        );
      }

      if (department) {
        colleagues = colleagues.filter(user => user.department === department);
      }

      const limitNum = parseInt(limit as string);
      colleagues = colleagues.slice(0, limitNum);

      // Return minimal info for privacy
      const colleagueInfo = colleagues.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        location: user.location,
      }));

      res.json({
        success: true,
        data: colleagueInfo,
      });
    } catch (error) {
      next(error);
    }
  },
};