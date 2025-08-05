import express from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validations/auth.validation';

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export { router as authRoutes };
