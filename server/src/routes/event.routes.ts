import express from 'express';
import { eventController } from '../controllers/event.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../validations/event.validation';

const router = express.Router();

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/categories', eventController.getEventCategories);
router.get('/search', eventController.searchEvents);

// Authenticated routes
router.use(authMiddleware);

router.post('/', validate(createEventSchema), eventController.createEvent);
router.get('/:id', eventController.getEventById);
router.put('/:id', validate(updateEventSchema), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.post('/:id/participants', eventController.addParticipant);
router.delete('/:id/participants/:userId', eventController.removeParticipant);

export { router as eventRoutes };
