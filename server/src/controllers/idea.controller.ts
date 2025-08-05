import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

export type EventIdea = {
  id: number;
  title: string;
  description: string;
  category: string;
  estimatedParticipants: number;
  estimatedDuration: string; // e.g., "2 hours", "full day"
  estimatedCost?: string;
  requiredResources?: string[];
  location?: string;
  tags?: string[];
  votes: Vote[];
  comments: Comment[];
  createdBy: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  reviewedBy?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Vote = {
  id: number;
  userId: number;
  ideaId: number;
  voteType: 'up' | 'down';
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

export type Comment = {
  id: number;
  userId: number;
  ideaId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

// Mock data storage
const eventIdeas: EventIdea[] = [
  {
    id: 1,
    title: 'Monthly Beach Cleanup Challenge',
    description: 'Organize monthly beach cleanup events with gamification elements. Teams compete to collect the most trash, with prizes for winners.',
    category: 'environment',
    estimatedParticipants: 50,
    estimatedDuration: '3 hours',
    estimatedCost: '£200 for supplies and prizes',
    requiredResources: ['Trash bags', 'Gloves', 'Data collection sheets', 'Prizes'],
    location: 'Various UK beaches',
    tags: ['outdoor', 'team-building', 'competition'],
    votes: [],
    comments: [],
    createdBy: {
      id: 2,
      email: 'manager@pwc.com',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager'
    },
    status: 'pending',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
];

let ideaIdCounter = 2;
let voteIdCounter = 1;
let commentIdCounter = 1;

export const ideaController = {
  // GET /api/ideas - Get all event ideas
  async getAllIdeas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, category, limit = '20', offset = '0' } = req.query;

      let filteredIdeas = eventIdeas;

      if (status) {
        filteredIdeas = filteredIdeas.filter(idea => idea.status === status);
      }

      if (category) {
        filteredIdeas = filteredIdeas.filter(idea => idea.category === category);
      }

      // Sort by votes and creation date
      filteredIdeas.sort((a, b) => {
        const aUpvotes = a.votes.filter(v => v.voteType === 'up').length;
        const bUpvotes = b.votes.filter(v => v.voteType === 'up').length;
        
        if (aUpvotes !== bUpvotes) {
          return bUpvotes - aUpvotes; // More upvotes first
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newer first
      });

      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedIdeas = filteredIdeas.slice(offsetNum, offsetNum + limitNum);

      // Add vote counts and user vote status
      const ideasWithVoteInfo = paginatedIdeas.map(idea => ({
        ...idea,
        upvotes: idea.votes.filter(v => v.voteType === 'up').length,
        downvotes: idea.votes.filter(v => v.voteType === 'down').length,
        userVote: req.user ? idea.votes.find(v => v.userId === req.user!.id)?.voteType : null,
        commentCount: idea.comments.length,
      }));

      res.json({
        success: true,
        data: {
          ideas: ideasWithVoteInfo,
          total: filteredIdeas.length,
          limit: limitNum,
          offset: offsetNum,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/ideas/:id - Get idea by ID
  async getIdeaById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const idea = eventIdeas.find(i => i.id === parseInt(id));

      if (!idea) {
        throw createError(404, 'Event idea not found');
      }

      const ideaWithVoteInfo = {
        ...idea,
        upvotes: idea.votes.filter(v => v.voteType === 'up').length,
        downvotes: idea.votes.filter(v => v.voteType === 'down').length,
        userVote: req.user ? idea.votes.find(v => v.userId === req.user!.id)?.voteType : null,
      };

      res.json({
        success: true,
        data: ideaWithVoteInfo,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/ideas - Create new event idea
  async createIdea(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const {
        title,
        description,
        category,
        estimatedParticipants,
        estimatedDuration,
        estimatedCost,
        requiredResources,
        location,
        tags,
      } = req.body;

      const newIdea: EventIdea = {
        id: ideaIdCounter++,
        title,
        description,
        category,
        estimatedParticipants,
        estimatedDuration,
        estimatedCost,
        requiredResources,
        location,
        tags: tags || [],
        votes: [],
        comments: [],
        createdBy: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      eventIdeas.push(newIdea);

      logger.info(`Event idea created: ${newIdea.title} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Event idea created successfully',
        data: newIdea,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/ideas/:id/vote - Vote on an idea
  async voteOnIdea(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const { voteType } = req.body; // 'up' or 'down'

      if (!['up', 'down'].includes(voteType)) {
        throw createError(400, 'Vote type must be "up" or "down"');
      }

      const idea = eventIdeas.find(i => i.id === parseInt(id));
      if (!idea) {
        throw createError(404, 'Event idea not found');
      }

      // Check if user already voted
      const existingVoteIndex = idea.votes.findIndex(v => v.userId === req.user!.id);

      if (existingVoteIndex !== -1) {
        // Update existing vote
        idea.votes[existingVoteIndex].voteType = voteType;
      } else {
        // Create new vote
        const newVote: Vote = {
          id: voteIdCounter++,
          userId: req.user.id,
          ideaId: idea.id,
          voteType,
          createdAt: new Date().toISOString(),
          user: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
          },
        };
        idea.votes.push(newVote);
      }

      idea.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: {
          upvotes: idea.votes.filter(v => v.voteType === 'up').length,
          downvotes: idea.votes.filter(v => v.voteType === 'down').length,
          userVote: voteType,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/ideas/:id/vote - Remove vote
  async removeVote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const idea = eventIdeas.find(i => i.id === parseInt(id));

      if (!idea) {
        throw createError(404, 'Event idea not found');
      }

      const voteIndex = idea.votes.findIndex(v => v.userId === req.user!.id);
      if (voteIndex === -1) {
        throw createError(404, 'Vote not found');
      }

      idea.votes.splice(voteIndex, 1);
      idea.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Vote removed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/ideas/:id/comments - Add comment
  async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      const { id } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        throw createError(400, 'Comment content is required');
      }

      const idea = eventIdeas.find(i => i.id === parseInt(id));
      if (!idea) {
        throw createError(404, 'Event idea not found');
      }

      const newComment: Comment = {
        id: commentIdCounter++,
        userId: req.user.id,
        ideaId: idea.id,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        user: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        },
      };

      idea.comments.push(newComment);
      idea.updatedAt = new Date().toISOString();

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: newComment,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/ideas/:id/status - Update idea status (admin/manager only)
  async updateIdeaStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        throw createError(403, 'Admin or manager access required');
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      if (!['pending', 'approved', 'rejected', 'implemented'].includes(status)) {
        throw createError(400, 'Invalid status');
      }

      const ideaIndex = eventIdeas.findIndex(i => i.id === parseInt(id));
      if (ideaIndex === -1) {
        throw createError(404, 'Event idea not found');
      }

      eventIdeas[ideaIndex] = {
        ...eventIdeas[ideaIndex],
        status,
        reviewedBy: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        },
        reviewedAt: new Date().toISOString(),
        reviewNotes,
        updatedAt: new Date().toISOString(),
      };

      logger.info(`Event idea status updated: ${eventIdeas[ideaIndex].title} -> ${status} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Idea status updated successfully',
        data: eventIdeas[ideaIndex],
      });
    } catch (error) {
      next(error);
    }
  },
};