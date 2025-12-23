import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

// In-memory event storage
export type Event = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  maxParticipants: number;
  requirements?: string;
  objectives?: string;
  contactEmail: string;
  contactPhone?: string;
  tags?: string[];
  participants?: Participant[];
  createdBy: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'cancelled' | 'completed';
};

export type Participant = {
  id: number;
  userId: number;
  eventId: number;
  status: 'pending' | 'confirmed' | 'attended' | 'cancelled';
  feedback?: string;
  attendedAt?: string;
  joinedAt: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

// In-memory event data
const events: Event[] = [
  {
    id: 1,
    title: 'Community Garden Cleanup',
    description: 'Help maintain and beautify our local community garden. We\'ll be weeding, planting, and general maintenance.',
    startDate: '2024-12-15T09:00:00Z',
    endDate: '2024-12-15T12:00:00Z',
    location: 'London Community Garden, Camden',
    category: 'environment',
    maxParticipants: 15,
    requirements: 'No experience needed, gardening gloves provided',
    objectives: 'Improve local green spaces and build community connections',
    contactEmail: 'garden@pwc.com',
    contactPhone: '+44 20 7123 4567',
    tags: ['outdoor', 'physical', 'weekend'],
    participants: [],
    createdBy: {
      id: 1,
      email: 'admin@pwc.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    },
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    status: 'active',
  },
  {
    id: 2,
    title: 'Tech Skills Workshop for Seniors',
    description: 'Teach basic computer and smartphone skills to elderly residents at the local community center.',
    startDate: '2024-12-18T14:00:00Z',
    endDate: '2024-12-18T17:00:00Z',
    location: 'Manchester Community Center',
    category: 'education',
    maxParticipants: 8,
    requirements: 'Basic tech knowledge, patience, and good communication skills',
    objectives: 'Bridge the digital divide and support elderly community members',
    contactEmail: 'tech@pwc.com',
    tags: ['indoor', 'technical', 'education'],
    participants: [],
    createdBy: {
      id: 2,
      email: 'manager@pwc.com',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager'
    },
    createdAt: '2024-12-02T14:30:00Z',
    updatedAt: '2024-12-02T14:30:00Z',
    status: 'active',
  },
];

let eventIdCounter = 3;
let participantIdCounter = 1;

export const eventController = {
  // GET /api/events - Get all events (public)
  async getAllEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category, location, status = 'active', limit = '50', offset = '0' } = req.query;

      let filteredEvents = events.filter(event => event.status === status);

      if (category) {
        filteredEvents = filteredEvents.filter(event => event.category === category);
      }
      if (location) {
        filteredEvents = filteredEvents.filter(event => 
          event.location.toLowerCase().includes((location as string).toLowerCase())
        );
      }

      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedEvents = filteredEvents.slice(offsetNum, offsetNum + limitNum);

      res.json({
        success: true,
        data: {
          events: paginatedEvents,
          total: filteredEvents.length,
          limit: limitNum,
          offset: offsetNum,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/events/categories - Get event categories
  async getEventCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = [
        { CategoryID: 1, CategoryName: 'environment', Description: 'Environmental activities', Color: '#4caf50' },
        { CategoryID: 2, CategoryName: 'education', Description: 'Educational programs', Color: '#2196f3' },
        { CategoryID: 3, CategoryName: 'health', Description: 'Health and wellness', Color: '#f44336' },
        { CategoryID: 4, CategoryName: 'community', Description: 'Community building', Color: '#ff9800' },
        { CategoryID: 5, CategoryName: 'elderly-care', Description: 'Elderly care', Color: '#9c27b0' },
        { CategoryID: 6, CategoryName: 'youth-support', Description: 'Youth support', Color: '#00bcd4' },
        { CategoryID: 7, CategoryName: 'food-security', Description: 'Food security', Color: '#8bc34a' },
        { CategoryID: 8, CategoryName: 'homelessness', Description: 'Homelessness support', Color: '#795548' },
        { CategoryID: 9, CategoryName: 'disability-support', Description: 'Disability support', Color: '#607d8b' },
        { CategoryID: 10, CategoryName: 'mental-health', Description: 'Mental health', Color: '#e91e63' }
      ];

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/events/search - Search events
  async searchEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { q, category, location, startDate, endDate } = req.query;

      let filteredEvents = events.filter(event => event.status === 'active');

      if (q) {
        const searchTerm = (q as string).toLowerCase();
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (category) {
        filteredEvents = filteredEvents.filter(event => event.category === category);
      }

      if (location) {
        filteredEvents = filteredEvents.filter(event =>
          event.location.toLowerCase().includes((location as string).toLowerCase())
        );
      }

      if (startDate) {
        filteredEvents = filteredEvents.filter(event =>
          new Date(event.startDate) >= new Date(startDate as string)
        );
      }

      if (endDate) {
        filteredEvents = filteredEvents.filter(event =>
          new Date(event.endDate) <= new Date(endDate as string)
        );
      }

      res.json({
        success: true,
        data: filteredEvents,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/events/:id - Get event by ID
  async getEventById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const event = events.find(e => e.id === parseInt(id));

      if (!event) {
        throw createError(404, 'Event not found');
      }

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/events - Create new event (authenticated)
  async createEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const eventData = req.body;
      
      const newEvent: Event = {
        id: eventIdCounter++,
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        category: eventData.category,
        maxParticipants: parseInt(eventData.maxParticipants),
        requirements: eventData.requirements,
        objectives: eventData.objectives,
        contactEmail: eventData.contactEmail,
        contactPhone: eventData.contactPhone,
        tags: eventData.tags || [],
        participants: [],
        createdBy: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
      };

      events.push(newEvent);

      logger.info(`Event created: ${newEvent.title} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: newEvent,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/events/:id - Update event
  async updateEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const eventIndex = events.findIndex(e => e.id === parseInt(id));

      if (eventIndex === -1) {
        throw createError(404, 'Event not found');
      }

      const event = events[eventIndex];

      if (event.createdBy.id !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
        throw createError(403, 'You can only update events you created');
      }

      const updatedEvent: Event = {
        ...event,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      events[eventIndex] = updatedEvent;

      logger.info(`Event updated: ${updatedEvent.title} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/events/:id - Delete event
  async deleteEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const eventIndex = events.findIndex(e => e.id === parseInt(id));

      if (eventIndex === -1) {
        throw createError(404, 'Event not found');
      }

      const event = events[eventIndex];

      if (event.createdBy.id !== req.user.id && req.user.role !== 'admin') {
        throw createError(403, 'You can only delete events you created or you must be an admin');
      }

      events.splice(eventIndex, 1);

      logger.info(`Event deleted: ${event.title} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/events/:id/participants - Join event
  async addParticipant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const event = events.find(e => e.id === parseInt(id));

      if (!event) {
        throw createError(404, 'Event not found');
      }

      if (event.participants && event.participants.length >= event.maxParticipants) {
        throw createError(400, 'Event is full');
      }

      const existingParticipant = event.participants?.find(p => p.userId === req.user!.id);
      if (existingParticipant) {
        throw createError(400, 'You are already registered for this event');
      }

      const newParticipant: Participant = {
        id: participantIdCounter++,
        userId: req.user.id,
        eventId: event.id,
        status: 'confirmed',
        joinedAt: new Date().toISOString(),
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
        },
      };

      if (!event.participants) {
        event.participants = [];
      }
      event.participants.push(newParticipant);

      logger.info(`User ${req.user.email} joined event: ${event.title}`);

      res.json({
        success: true,
        message: 'Successfully joined the event',
        data: newParticipant,
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/events/:id/participants/:userId - Leave event
  async removeParticipant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id, userId } = req.params;
      const event = events.find(e => e.id === parseInt(id));

      if (!event) {
        throw createError(404, 'Event not found');
      }

      const targetUserId = parseInt(userId);
      if (req.user.id !== targetUserId && req.user.role !== 'admin') {
        throw createError(403, 'You can only remove yourself from events');
      }

      if (!event.participants) {
        throw createError(400, 'No participants found for this event');
      }

      const participantIndex = event.participants.findIndex(p => p.userId === targetUserId);
      if (participantIndex === -1) {
        throw createError(404, 'Participant not found');
      }

      event.participants.splice(participantIndex, 1);

      logger.info(`User ${targetUserId} left event: ${event.title}`);

      res.json({
        success: true,
        message: 'Successfully left the event',
      });
    } catch (error) {
      next(error);
    }
  },
};