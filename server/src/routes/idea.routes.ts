import express from 'express';
import { ideaController } from '../controllers/idea.controller';
import { authMiddleware, managerOrAdminMiddleware } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', ideaController.getAllIdeas);
router.get('/:id', ideaController.getIdeaById);

// Authenticated routes
router.use(authMiddleware);

router.post('/', ideaController.createIdea);
router.post('/:id/vote', ideaController.voteOnIdea);
router.delete('/:id/vote', ideaController.removeVote);
router.post('/:id/comments', ideaController.addComment);

// Manager/Admin only routes
router.put('/:id/status', managerOrAdminMiddleware, ideaController.updateIdeaStatus);

export { router as ideaRoutes };