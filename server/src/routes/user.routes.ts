import express from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/users - Get all users (admin only)
router.get('/', adminMiddleware, userController.getAllUsers);

// GET /api/users/colleagues - Get colleagues for invitations
router.get('/colleagues', userController.getColleagues);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// PUT /api/users/:id - Update user profile
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Deactivate user (admin only)
router.delete('/:id', adminMiddleware, userController.deactivateUser);

// POST /api/users/:id/activate - Reactivate user (admin only)
router.post('/:id/activate', adminMiddleware, userController.activateUser);

export { router as userRoutes };