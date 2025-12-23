// Real server with database connection
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { userDb } = require('./database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT helper
function generateToken(user) {
    const payload = {
        id: user.UserID,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: user.Role
    };
    
    const secret = process.env.JWT_SECRET || 'my_super_secret_key_for_jwt_tokens_12345';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    return jwt.sign(payload, secret, { expiresIn });
}

// JWT middleware to verify token
function verifyToken(req, res, next) {
    console.log('🔐 verifyToken middleware called');
    const authHeader = req.headers['authorization'];
    console.log('📋 Auth header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        console.log('❌ No token found');
        req.user = null;
        return next();
    }
    
    const secret = process.env.JWT_SECRET || 'my_super_secret_key_for_jwt_tokens_12345';
    
    jwt.verify(token, secret, (err, user) => {
        if (err) {
            console.log('❌ JWT verification failed:', err.message);
            req.user = null;
        } else {
            console.log('✅ JWT verified, user:', user);
            req.user = user;
        }
        next();
    });
}

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Real server with database is working!', 
        timestamp: new Date().toISOString() 
    });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, department, location } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, first name, and last name are required'
            });
        }

        // Create user in database
        const newUser = await userDb.createUser({
            email,
            password,
            firstName,
            lastName,
            department,
            location
        });

        // Generate token
        const token = generateToken(newUser);

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: newUser.UserID,
                    email: newUser.Email,
                    firstName: newUser.FirstName,
                    lastName: newUser.LastName,
                    role: newUser.Role,
                    department: newUser.Department,
                    location: newUser.Location
                },
                token
            }
        });

        console.log(`✅ New user registered: ${email}`);

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await userDb.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await userDb.verifyPassword(password, user.PasswordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user);

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.UserID,
                    email: user.Email,
                    firstName: user.FirstName,
                    lastName: user.LastName,
                    role: user.Role,
                    department: user.Department,
                    location: user.Location,
                    interests: user.Interests ? user.Interests.split(',').map((i) => i.trim()) : [],
                    bio: user.Bio
                },
                token
            }
        });

        console.log(`✅ User logged in: ${email}`);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Get all users (for testing)
app.get('/api/users', async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT UserID, Email, FirstName, LastName, Role, Department, Location, CreatedAt FROM Users WHERE IsActive = 1');
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Event Management Endpoints

// Get all events with category information
app.get('/api/events', verifyToken, async (req, res) => {
    console.log('📊 GET /api/events called');
    console.log('👤 User from token:', req.user);
    try {
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        const currentUserId = req.user ? req.user.id : null;
        
        // First get events without problematic aggregation
        const eventsResult = await pool.request()
            .query(`
                SELECT 
                    e.EventID, e.Title, e.Description, e.Location, 
                    e.StartDateTime, e.EndDateTime, e.MaxParticipants, 
                    e.RequiredSkills, e.Status, e.CreatedAt, e.CreatedBy,
                    c.CategoryName, c.Color as CategoryColor,
                    u.FirstName + ' ' + u.LastName as CreatedByName
                FROM Events e
                LEFT JOIN EventCategories c ON e.CategoryID = c.CategoryID
                LEFT JOIN Users u ON e.CreatedBy = u.UserID
                WHERE e.Status = 'published'
                ORDER BY e.StartDateTime ASC
            `);

        // Then get participant counts separately
        const participantCounts = await pool.request()
            .query(`
                SELECT EventID, COUNT(*) as CurrentParticipants
                FROM EventParticipants 
                WHERE Status IN ('registered', 'confirmed')
                GROUP BY EventID
            `);

        // Get user registrations if user is logged in
        let userRegistrations = [];
        if (currentUserId) {
            console.log(`🔍 Checking registrations for user ID: ${currentUserId}`);
            const userRegs = await pool.request()
                .input('userId', sql.Int, currentUserId)
                .query(`
                    SELECT EventID
                    FROM EventParticipants 
                    WHERE UserID = @userId AND Status IN ('registered', 'confirmed')
                `);
            userRegistrations = userRegs.recordset.map(reg => reg.EventID);
            console.log(`📋 User ${currentUserId} is registered for events: ${userRegistrations.join(', ')}`);
        } else {
            console.log('❌ No user ID found in token');
        }

        // Combine the results
        const events = eventsResult.recordset.map(event => {
            const participantCount = participantCounts.recordset.find(p => p.EventID === event.EventID);
            const isUserRegistered = userRegistrations.includes(event.EventID);
            const isCreatedByCurrentUser = currentUserId && event.CreatedBy === currentUserId;
            console.log(`🔨 Event ${event.EventID}: CreatedBy=${event.CreatedBy}, CurrentUser=${currentUserId}, IsCreator=${isCreatedByCurrentUser}`);
            
            return {
                ...event,
                CurrentParticipants: participantCount ? participantCount.CurrentParticipants : 0,
                IsUserRegistered: isUserRegistered,
                IsCreatedByCurrentUser: isCreatedByCurrentUser
            };
        });
        
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events'
        });
    }
});

// Get event categories
app.get('/api/events/categories', async (req, res) => {
    try {
        const { getPool } = require('./database');
        const pool = await getPool();
        
        const result = await pool.request()
            .query('SELECT CategoryID, CategoryName, Description, Color FROM EventCategories ORDER BY CategoryName');
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

// Get single event by ID (MUST be after /categories route)
app.get('/api/events/:eventId', verifyToken, async (req, res) => {
    console.log(`🔍 GET single event called for ID: ${req.params.eventId}`);
    try {
        const { eventId } = req.params;
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        const result = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT 
                    e.EventID, e.Title, e.Description, e.Location, 
                    e.StartDateTime, e.EndDateTime, e.MaxParticipants, 
                    e.RequiredSkills, e.Status, e.CreatedAt, e.CreatedBy,
                    c.CategoryName, c.Color as CategoryColor,
                    u.FirstName + ' ' + u.LastName as CreatedByName
                FROM Events e
                LEFT JOIN EventCategories c ON e.CategoryID = c.CategoryID
                LEFT JOIN Users u ON e.CreatedBy = u.UserID
                WHERE e.EventID = @eventId AND e.Status = 'published'
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event'
        });
    }
});

// Update event
app.put('/api/events/:eventId', verifyToken, async (req, res) => {
    console.log(`🔄 PUT update event called for ID: ${req.params.eventId}`);
    try {
        const { eventId } = req.params;
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const { 
            title, description, location, startDateTime, endDateTime, 
            maxParticipants, requiredSkills, categoryID 
        } = req.body;
        
        if (!title || !startDateTime || !endDateTime) {
            return res.status(400).json({
                success: false,
                message: 'Title, start date, and end date are required'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        // First check if user owns this event
        const ownerCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, req.user.id)
            .query('SELECT CreatedBy FROM Events WHERE EventID = @eventId');
            
        if (ownerCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        if (ownerCheck.recordset[0].CreatedBy !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit events you created'
            });
        }
        
        const result = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar(sql.MAX), description)
            .input('location', sql.NVarChar, location)
            .input('startDateTime', sql.DateTime2, new Date(startDateTime))
            .input('endDateTime', sql.DateTime2, new Date(endDateTime))
            .input('maxParticipants', sql.Int, maxParticipants)
            .input('requiredSkills', sql.NVarChar, JSON.stringify(requiredSkills || []))
            .input('categoryID', sql.Int, categoryID)
            .query(`
                UPDATE Events
                SET Title = @title, Description = @description, Location = @location,
                    StartDateTime = @startDateTime, EndDateTime = @endDateTime,
                    MaxParticipants = @maxParticipants, RequiredSkills = @requiredSkills,
                    CategoryID = @categoryID, UpdatedAt = GETUTCDATE()
                WHERE EventID = @eventId
            `);

        // Get all registered participants to notify them about the update
        const participantsResult = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT UserID
                FROM EventParticipants
                WHERE EventID = @eventId AND Status IN ('registered', 'confirmed') AND UserID != @userId
            `, { userId: req.user.id });

        // Notify all participants about the event update
        for (const participant of participantsResult.recordset) {
            await createNotification(
                participant.UserID,
                'event_updated',
                'Event Updated',
                `The event "${title}" has been updated. Please review the changes.`,
                'event',
                parseInt(eventId),
                `/events/${eventId}`
            );
        }

        res.json({
            success: true,
            message: 'Event updated successfully'
        });

        console.log(`✅ Event ${eventId} updated by user ${req.user.id}`);
        
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event'
        });
    }
});

// Create new event
app.post('/api/events', async (req, res) => {
    try {
        const { 
            title, description, location, startDateTime, endDateTime, 
            maxParticipants, requiredSkills, categoryID 
        } = req.body;
        
        // For now, we'll use a hardcoded creator ID (in real app, get from JWT token)
        const createdBy = 1; // This should come from authenticated user
        
        if (!title || !startDateTime || !endDateTime) {
            return res.status(400).json({
                success: false,
                message: 'Title, start date, and end date are required'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        const result = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar(sql.MAX), description)
            .input('location', sql.NVarChar, location)
            .input('startDateTime', sql.DateTime2, new Date(startDateTime))
            .input('endDateTime', sql.DateTime2, new Date(endDateTime))
            .input('maxParticipants', sql.Int, maxParticipants)
            .input('requiredSkills', sql.NVarChar, JSON.stringify(requiredSkills || []))
            .input('categoryID', sql.Int, categoryID)
            .input('createdBy', sql.Int, createdBy)
            .query(`
                INSERT INTO Events (Title, Description, Location, StartDateTime, EndDateTime, 
                                  MaxParticipants, RequiredSkills, CategoryID, CreatedBy, Status, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.*
                VALUES (@title, @description, @location, @startDateTime, @endDateTime, 
                        @maxParticipants, @requiredSkills, @categoryID, @createdBy, 'published', GETUTCDATE(), GETUTCDATE())
            `);
        
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: result.recordset[0]
        });

        console.log(`✅ New event created: ${title}`);
        
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event'
        });
    }
});

// Register for an event
app.post('/api/events/:eventId/register', verifyToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const userId = req.user.id;
        
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        // Check if user is already registered
        const existingRegistration = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM EventParticipants WHERE EventID = @eventId AND UserID = @userId');
        
        if (existingRegistration.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event'
            });
        }
        
        // Check if event has space and hasn't already happened
        const eventCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT e.MaxParticipants, e.StartDateTime, COUNT(ep.UserID) as CurrentParticipants
                FROM Events e
                LEFT JOIN EventParticipants ep ON e.EventID = ep.EventID AND ep.Status IN ('registered', 'confirmed')
                WHERE e.EventID = @eventId
                GROUP BY e.MaxParticipants, e.StartDateTime
            `);

        const event = eventCheck.recordset[0];

        // Check if event has already happened
        if (event && event.StartDateTime && new Date(event.StartDateTime) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot join a past event'
            });
        }

        if (event && event.MaxParticipants && event.CurrentParticipants >= event.MaxParticipants) {
            return res.status(400).json({
                success: false,
                message: 'Event is full'
            });
        }
        
        // Register user for event
        await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query(`
                INSERT INTO EventParticipants (EventID, UserID, Status, RegistrationDate)
                VALUES (@eventId, @userId, 'registered', GETUTCDATE())
            `);

        // Get event details and creator info for notifications
        const eventDetails = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query('SELECT Title, CreatedBy FROM Events WHERE EventID = @eventId');

        const eventTitle = eventDetails.recordset[0]?.Title || 'Event';
        const eventCreatorId = eventDetails.recordset[0]?.CreatedBy;

        // Get user info for creator notification
        const userInfo = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT FirstName, LastName FROM Users WHERE UserID = @userId');

        const userFullName = userInfo.recordset[0] ?
            `${userInfo.recordset[0].FirstName} ${userInfo.recordset[0].LastName}` : 'A user';

        // Create notification for user who registered
        await createNotification(
            userId,
            'event_registered',
            'Successfully Registered',
            `You have successfully registered for "${eventTitle}"`,
            'event',
            parseInt(eventId),
            `/events/${eventId}`
        );

        // Notify event creator if it's not the same user
        if (eventCreatorId && eventCreatorId !== userId) {
            await createNotification(
                eventCreatorId,
                'event_participant_joined',
                'New Participant',
                `${userFullName} has registered for your event "${eventTitle}"`,
                'event',
                parseInt(eventId),
                `/events/${eventId}`
            );
        }

        res.json({
            success: true,
            message: 'Successfully registered for event'
        });

        console.log(`✅ User ${userId} registered for event ${eventId}`);
        
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register for event'
        });
    }
});

// Unregister from an event
app.delete('/api/events/:eventId/unregister', verifyToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const userId = req.user.id;
        
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        // Check if user is registered
        const existingRegistration = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM EventParticipants WHERE EventID = @eventId AND UserID = @userId');
        
        if (existingRegistration.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You are not registered for this event'
            });
        }
        
        // Remove user from event
        await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('DELETE FROM EventParticipants WHERE EventID = @eventId AND UserID = @userId');
        
        res.json({
            success: true,
            message: 'Successfully unregistered from event'
        });

        console.log(`✅ User ${userId} unregistered from event ${eventId}`);
        
    } catch (error) {
        console.error('Error unregistering from event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unregister from event'
        });
    }
});

// Get event participants
app.get('/api/events/:eventId/participants', verifyToken, async (req, res) => {
    console.log(`👥 GET participants called for event ID: ${req.params.eventId}`);
    
    try {
        const eventId = parseInt(req.params.eventId);
        
        if (!eventId || isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        // Get participants with user details
        const result = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT 
                    u.UserID, u.FirstName, u.LastName, u.Email,
                    ep.Status
                FROM EventParticipants ep
                INNER JOIN Users u ON ep.UserID = u.UserID
                WHERE ep.EventID = @eventId 
                AND ep.Status IN ('registered', 'confirmed')
                ORDER BY u.FirstName ASC
            `);
        
        console.log(`✅ Found ${result.recordset.length} participants for event ${eventId}`);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error fetching event participants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event participants'
        });
    }
});

// ==========================================
// IDEAS MANAGEMENT ENDPOINTS
// ==========================================

// Get all idea categories
app.get('/api/ideas/categories', async (req, res) => {
    console.log('📚 GET idea categories called');
    try {
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        const result = await pool.request()
            .query(`
                SELECT CategoryID, CategoryName, Description, Color
                FROM IdeaCategories 
                WHERE IsActive = 1
                ORDER BY CategoryName ASC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching idea categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch idea categories'
        });
    }
});

// Get all ideas with voting stats
app.get('/api/ideas', verifyToken, async (req, res) => {
    console.log('💡 GET ideas called');
    console.log('👤 User from token:', req.user);
    
    try {
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        const currentUserId = req.user ? req.user.id : null;
        
        // Get ideas with vote counts and user vote status
        const result = await pool.request()
            .input('userId', sql.Int, currentUserId)
            .query(`
                SELECT
                    i.IdeaID,
                    i.Title,
                    i.Description,
                    i.Location,
                    i.ExpectedImpact,
                    i.RequiredResources,
                    i.EstimatedCost,
                    i.EstimatedParticipants,
                    i.Status,
                    i.CreatedAt,
                    ic.CategoryName,
                    ic.Color as CategoryColor,
                    u.FirstName + ' ' + u.LastName as SubmittedBy,
                    COALESCE(upvotes.UpvoteCount, 0) as UpvoteCount,
                    COALESCE(downvotes.DownvoteCount, 0) as DownvoteCount,
                    COALESCE(upvotes.UpvoteCount, 0) - COALESCE(downvotes.DownvoteCount, 0) as NetVotes,
                    CASE WHEN uv.VoteType IS NOT NULL THEN uv.VoteType ELSE NULL END as UserVote,
                    CASE WHEN i.CreatedBy = @userId THEN 1 ELSE 0 END as IsCreatedByCurrentUser
                FROM Ideas i
                LEFT JOIN IdeaCategories ic ON i.CategoryID = ic.CategoryID
                LEFT JOIN Users u ON i.CreatedBy = u.UserID
                LEFT JOIN (
                    SELECT IdeaID, COUNT(*) as UpvoteCount 
                    FROM IdeaVotes 
                    WHERE VoteType = 'upvote' 
                    GROUP BY IdeaID
                ) upvotes ON i.IdeaID = upvotes.IdeaID
                LEFT JOIN (
                    SELECT IdeaID, COUNT(*) as DownvoteCount 
                    FROM IdeaVotes 
                    WHERE VoteType = 'downvote' 
                    GROUP BY IdeaID
                ) downvotes ON i.IdeaID = downvotes.IdeaID
                LEFT JOIN IdeaVotes uv ON i.IdeaID = uv.IdeaID AND uv.UserID = @userId
                WHERE i.IsActive = 1
                ORDER BY NetVotes DESC, i.CreatedAt DESC
            `);
        
        console.log(`✅ Found ${result.recordset.length} ideas`);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error fetching ideas:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ideas'
        });
    }
});

// Create new idea
app.post('/api/ideas', verifyToken, async (req, res) => {
    console.log('💡 POST create idea called');
    console.log('👤 User:', req.user);
    console.log('📝 Idea data:', req.body);
    
    try {
        const {
            title,
            description,
            location,
            expectedImpact,
            requiredResources,
            estimatedCost,
            estimatedParticipants,
            categoryID
        } = req.body;

        if (!title || !description || !categoryID) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and category are required'
            });
        }
        
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        const result = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar(sql.MAX), description)
            .input('location', sql.NVarChar, location || null)
            .input('expectedImpact', sql.NVarChar, expectedImpact || null)
            .input('requiredResources', sql.NVarChar, requiredResources || null)
            .input('estimatedCost', sql.Decimal(10, 2), estimatedCost || null)
            .input('estimatedParticipants', sql.Int, estimatedParticipants || null)
            .input('categoryID', sql.Int, categoryID)
            .input('createdBy', sql.Int, req.user.id)
            .query(`
                INSERT INTO Ideas (
                    Title, Description, Location, ExpectedImpact, RequiredResources,
                    EstimatedCost, EstimatedParticipants, CategoryID, CreatedBy,
                    Status, IsActive, CreatedAt, UpdatedAt
                )
                OUTPUT INSERTED.IdeaID, INSERTED.Title, INSERTED.Status
                VALUES (
                    @title, @description, @location, @expectedImpact, @requiredResources,
                    @estimatedCost, @estimatedParticipants, @categoryID, @createdBy,
                    'submitted', 1, GETUTCDATE(), GETUTCDATE()
                )
            `);
        
        console.log(`✅ Idea created with ID: ${result.recordset[0].IdeaID}`);
        
        res.json({
            success: true,
            message: 'Idea submitted successfully!',
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('Error creating idea:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create idea'
        });
    }
});

// Vote on an idea
app.post('/api/ideas/:ideaId/vote', verifyToken, async (req, res) => {
    console.log(`🗳️ POST vote on idea ${req.params.ideaId}`);
    console.log('👤 User:', req.user);
    console.log('📝 Vote data:', req.body);
    
    try {
        const ideaId = parseInt(req.params.ideaId);
        const { voteType } = req.body; // 'upvote' or 'downvote'
        
        if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({
                success: false,
                message: 'Vote type must be either "upvote" or "downvote"'
            });
        }
        
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        // Check if user already voted on this idea
        const existingVote = await pool.request()
            .input('ideaId', sql.Int, ideaId)
            .input('userId', sql.Int, req.user.id)
            .query('SELECT VoteType FROM IdeaVotes WHERE IdeaID = @ideaId AND UserID = @userId');
        
        if (existingVote.recordset.length > 0) {
            // Update existing vote
            await pool.request()
                .input('ideaId', sql.Int, ideaId)
                .input('userId', sql.Int, req.user.id)
                .input('voteType', sql.NVarChar, voteType)
                .query('UPDATE IdeaVotes SET VoteType = @voteType WHERE IdeaID = @ideaId AND UserID = @userId');
        } else {
            // Create new vote
            await pool.request()
                .input('ideaId', sql.Int, ideaId)
                .input('userId', sql.Int, req.user.id)
                .input('voteType', sql.NVarChar, voteType)
                .query(`
                    INSERT INTO IdeaVotes (IdeaID, UserID, VoteType, CreatedAt)
                    VALUES (@ideaId, @userId, @voteType, GETUTCDATE())
                `);
        }
        
        console.log(`✅ User ${req.user.id} voted ${voteType} on idea ${ideaId}`);
        
        res.json({
            success: true,
            message: 'Vote recorded successfully!'
        });
        
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record vote'
        });
    }
});

// Remove vote from an idea
app.delete('/api/ideas/:ideaId/vote', verifyToken, async (req, res) => {
    console.log(`🗳️ DELETE vote on idea ${req.params.ideaId}`);
    
    try {
        const ideaId = parseInt(req.params.ideaId);
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        
        await pool.request()
            .input('ideaId', sql.Int, ideaId)
            .input('userId', sql.Int, req.user.id)
            .query('DELETE FROM IdeaVotes WHERE IdeaID = @ideaId AND UserID = @userId');
        
        console.log(`✅ User ${req.user.id} removed vote from idea ${ideaId}`);
        
        res.json({
            success: true,
            message: 'Vote removed successfully!'
        });
        
    } catch (error) {
        console.error('Error removing vote:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove vote'
        });
    }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// Get admin dashboard statistics
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    console.log('📊 GET admin stats called');

    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();

        // Get statistics
        const stats = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Events) as TotalEvents,
                (SELECT COUNT(*) FROM Ideas WHERE IsActive = 1) as TotalIdeas,
                (SELECT COUNT(*) FROM Users) as TotalUsers,
                (SELECT COUNT(*) FROM EventParticipants) as TotalRegistrations,
                (SELECT COUNT(*) FROM Ideas WHERE Status = 'submitted' AND IsActive = 1) as PendingIdeas
        `);

        res.json({
            success: true,
            data: {
                totalEvents: stats.recordset[0].TotalEvents,
                totalIdeas: stats.recordset[0].TotalIdeas,
                totalUsers: stats.recordset[0].TotalUsers,
                totalRegistrations: stats.recordset[0].TotalRegistrations,
                pendingIdeas: stats.recordset[0].PendingIdeas
            }
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

// Get pending ideas for review
app.get('/api/admin/pending-ideas', verifyToken, async (req, res) => {
    console.log('📋 GET pending ideas called');

    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT
                i.IdeaID,
                i.Title,
                i.Description,
                i.Location,
                i.Status,
                i.CreatedAt,
                ic.CategoryName,
                ic.Color as CategoryColor,
                u.FirstName + ' ' + u.LastName as SubmittedBy,
                COALESCE(upvotes.UpvoteCount, 0) as UpvoteCount,
                COALESCE(downvotes.DownvoteCount, 0) as DownvoteCount,
                COALESCE(upvotes.UpvoteCount, 0) - COALESCE(downvotes.DownvoteCount, 0) as NetVotes
            FROM Ideas i
            LEFT JOIN IdeaCategories ic ON i.CategoryID = ic.CategoryID
            LEFT JOIN Users u ON i.CreatedBy = u.UserID
            LEFT JOIN (
                SELECT IdeaID, COUNT(*) as UpvoteCount
                FROM IdeaVotes
                WHERE VoteType = 'upvote'
                GROUP BY IdeaID
            ) upvotes ON i.IdeaID = upvotes.IdeaID
            LEFT JOIN (
                SELECT IdeaID, COUNT(*) as DownvoteCount
                FROM IdeaVotes
                WHERE VoteType = 'downvote'
                GROUP BY IdeaID
            ) downvotes ON i.IdeaID = downvotes.IdeaID
            WHERE i.Status = 'submitted' AND i.IsActive = 1
            ORDER BY i.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error fetching pending ideas:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending ideas'
        });
    }
});

// Update idea status (approve/reject)
app.put('/api/admin/ideas/:ideaId/status', verifyToken, async (req, res) => {
    console.log(`✏️ PUT update idea ${req.params.ideaId} status`);

    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const ideaId = parseInt(req.params.ideaId);
        const { status } = req.body;

        if (!status || !['approved', 'rejected', 'under_review', 'implemented'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();

        await pool.request()
            .input('ideaId', sql.Int, ideaId)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE Ideas
                SET Status = @status, UpdatedAt = GETUTCDATE()
                WHERE IdeaID = @ideaId
            `);

        console.log(`✅ Idea ${ideaId} status updated to ${status}`);

        res.json({
            success: true,
            message: `Idea status updated to ${status}`
        });

    } catch (error) {
        console.error('Error updating idea status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update idea status'
        });
    }
});

// Get approved ideas for conversion to events
app.get('/api/admin/approved-ideas', verifyToken, async (req, res) => {
    console.log('📋 GET approved ideas called');

    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT
                i.IdeaID,
                i.Title,
                i.Description,
                i.Location,
                i.Status,
                i.CreatedAt,
                i.ExpectedImpact,
                i.RequiredResources,
                i.EstimatedCost,
                i.EstimatedParticipants,
                ic.CategoryID,
                ic.CategoryName,
                ic.Color as CategoryColor,
                u.FirstName + ' ' + u.LastName as SubmittedBy,
                COALESCE(upvotes.UpvoteCount, 0) as UpvoteCount,
                COALESCE(downvotes.DownvoteCount, 0) as DownvoteCount,
                COALESCE(upvotes.UpvoteCount, 0) - COALESCE(downvotes.DownvoteCount, 0) as NetVotes
            FROM Ideas i
            LEFT JOIN IdeaCategories ic ON i.CategoryID = ic.CategoryID
            LEFT JOIN Users u ON i.CreatedBy = u.UserID
            LEFT JOIN (
                SELECT IdeaID, COUNT(*) as UpvoteCount
                FROM IdeaVotes
                WHERE VoteType = 'upvote'
                GROUP BY IdeaID
            ) upvotes ON i.IdeaID = upvotes.IdeaID
            LEFT JOIN (
                SELECT IdeaID, COUNT(*) as DownvoteCount
                FROM IdeaVotes
                WHERE VoteType = 'downvote'
                GROUP BY IdeaID
            ) downvotes ON i.IdeaID = downvotes.IdeaID
            WHERE i.Status = 'approved' AND i.IsActive = 1
            ORDER BY i.CreatedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error fetching approved ideas:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch approved ideas'
        });
    }
});

// Delete/Cancel event (admin or event creator only)
app.delete('/api/events/:eventId', verifyToken, async (req, res) => {
    console.log(`🗑️ DELETE event ${req.params.eventId} called`);

    try {
        const eventId = parseInt(req.params.eventId);
        const userId = req.user.id;
        const userRole = req.user.role;

        const { getPool, sql } = require('./database');
        const pool = await getPool();

        // First, get the event to check if user is the creator
        const eventResult = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT EventID, CreatedBy, Title
                FROM Events
                WHERE EventID = @eventId
            `);

        if (eventResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const event = eventResult.recordset[0];

        // Check authorization: must be admin OR event creator
        if (userRole !== 'admin' && event.CreatedBy !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only admins or event creators can delete events.'
            });
        }

        // Get all registered participants before cancelling
        const participantsResult = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT UserID
                FROM EventParticipants
                WHERE EventID = @eventId AND Status IN ('registered', 'confirmed')
            `);

        // Soft delete: Update status to 'cancelled'
        await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                UPDATE Events
                SET Status = 'cancelled', UpdatedAt = GETUTCDATE()
                WHERE EventID = @eventId
            `);

        // Notify all registered participants about cancellation
        for (const participant of participantsResult.recordset) {
            await createNotification(
                participant.UserID,
                'event_cancelled',
                'Event Cancelled',
                `The event "${event.Title}" has been cancelled`,
                'event',
                eventId,
                `/events/${eventId}`
            );
        }

        console.log(`✅ Event ${eventId} cancelled by user ${userId}`);

        res.json({
            success: true,
            message: 'Event cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel event'
        });
    }
});

// ==========================================
// IDEA COMMENTS ENDPOINTS
// ==========================================

// Get comments for an idea
app.get('/api/ideas/:ideaId/comments', verifyToken, async (req, res) => {
    console.log(`💬 GET comments for idea ${req.params.ideaId}`);

    try {
        const ideaId = parseInt(req.params.ideaId);
        const { getPool, sql } = require('./database');
        const pool = await getPool();

        const result = await pool.request()
            .input('ideaId', sql.Int, ideaId)
            .query(`
                SELECT
                    ic.CommentID,
                    ic.Comment,
                    ic.IsAdminComment,
                    ic.CreatedAt,
                    ic.UserID,
                    u.FirstName + ' ' + u.LastName as UserName,
                    u.Role as UserRole
                FROM IdeaComments ic
                INNER JOIN Users u ON ic.UserID = u.UserID
                WHERE ic.IdeaID = @ideaId
                ORDER BY ic.CreatedAt ASC
            `);

        console.log(`✅ Found ${result.recordset.length} comments for idea ${ideaId}`);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments'
        });
    }
});

// Add a comment to an idea
app.post('/api/ideas/:ideaId/comments', verifyToken, async (req, res) => {
    console.log(`💬 POST comment on idea ${req.params.ideaId}`);

    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const ideaId = parseInt(req.params.ideaId);
        const { comment } = req.body;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment cannot be empty'
            });
        }

        const { getPool, sql } = require('./database');
        const pool = await getPool();

        // Check if idea exists
        const ideaCheck = await pool.request()
            .input('ideaId', sql.Int, ideaId)
            .query('SELECT IdeaID FROM Ideas WHERE IdeaID = @ideaId AND IsActive = 1');

        if (ideaCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Idea not found'
            });
        }

        // Insert comment
        const result = await pool.request()
            .input('ideaId', sql.Int, ideaId)
            .input('userId', sql.Int, req.user.id)
            .input('comment', sql.NVarChar(1000), comment.trim())
            .input('isAdminComment', sql.Bit, req.user.role === 'admin' ? 1 : 0)
            .query(`
                INSERT INTO IdeaComments (IdeaID, UserID, Comment, IsAdminComment, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.CommentID, INSERTED.Comment, INSERTED.CreatedAt
                VALUES (@ideaId, @userId, @comment, @isAdminComment, GETUTCDATE(), GETUTCDATE())
            `);

        console.log(`✅ Comment added to idea ${ideaId} by user ${req.user.id}`);

        res.json({
            success: true,
            message: 'Comment added successfully',
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment'
        });
    }
});

// Delete a comment (admin or comment author only)
app.delete('/api/ideas/comments/:commentId', verifyToken, async (req, res) => {
    console.log(`🗑️ DELETE comment ${req.params.commentId}`);

    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const commentId = parseInt(req.params.commentId);
        const { getPool, sql } = require('./database');
        const pool = await getPool();

        // Get comment to check ownership
        const commentCheck = await pool.request()
            .input('commentId', sql.Int, commentId)
            .query('SELECT UserID FROM IdeaComments WHERE CommentID = @commentId');

        if (commentCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const comment = commentCheck.recordset[0];

        // Check authorization: must be admin OR comment author
        if (req.user.role !== 'admin' && comment.UserID !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own comments.'
            });
        }

        // Delete comment
        await pool.request()
            .input('commentId', sql.Int, commentId)
            .query('DELETE FROM IdeaComments WHERE CommentID = @commentId');

        console.log(`✅ Comment ${commentId} deleted by user ${req.user.id}`);

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment'
        });
    }
});

// ==================== NOTIFICATIONS ENDPOINTS ====================

// Helper function to create notifications
async function createNotification(userId, type, title, message, relatedEntityType = null, relatedEntityID = null) {
    try {
        const { getPool, sql } = require('./database');
        const pool = await getPool();
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('type', sql.NVarChar(50), type)
            .input('title', sql.NVarChar(200), title)
            .input('message', sql.NVarChar(500), message)
            .input('relatedEntityType', sql.NVarChar(50), relatedEntityType)
            .input('relatedEntityID', sql.Int, relatedEntityID)
            .query(`
                INSERT INTO Notifications (UserID, Type, Title, Message, RelatedEntityType, RelatedEntityID)
                VALUES (@userId, @type, @title, @message, @relatedEntityType, @relatedEntityID)
            `);
        console.log(`📬 Notification created for user ${userId}: ${title}`);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// GET /api/notifications - Get all notifications for the logged-in user
app.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        console.log(`🔐 verifyToken middleware called`);
        console.log(`📋 Auth header: ${req.headers.authorization}`);
        console.log(`✅ JWT verified, user: ${JSON.stringify(req.user)}`);
        console.log(`📬 GET notifications for user ${req.user.id}`);

        const pool = await getPool();
        const result = await pool.request()
            .input('userId', sql.Int, req.user.id)
            .query(`
                SELECT
                    NotificationID,
                    Type,
                    Title,
                    Message,
                    RelatedEntityType,
                    RelatedEntityID,
                    IsRead,
                    CreatedAt
                FROM Notifications
                WHERE UserID = @userId
                ORDER BY CreatedAt DESC
            `);

        console.log(`✅ Found ${result.recordset.length} notifications`);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// GET /api/notifications/unread/count - Get count of unread notifications
app.get('/api/notifications/unread/count', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        console.log(`📬 GET unread count for user ${req.user.id}`);

        const pool = await getPool();
        const result = await pool.request()
            .input('userId', sql.Int, req.user.id)
            .query(`
                SELECT COUNT(*) as UnreadCount
                FROM Notifications
                WHERE UserID = @userId AND IsRead = 0
            `);

        const count = result.recordset[0].UnreadCount;
        console.log(`✅ User ${req.user.id} has ${count} unread notifications`);

        res.json({
            success: true,
            count: count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count'
        });
    }
});

// PUT /api/notifications/:id/read - Mark a notification as read
app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const notificationId = parseInt(req.params.id);
        console.log(`📬 Mark notification ${notificationId} as read for user ${req.user.id}`);

        const pool = await getPool();

        // Check if notification belongs to user
        const checkResult = await pool.request()
            .input('notificationId', sql.Int, notificationId)
            .input('userId', sql.Int, req.user.id)
            .query(`
                SELECT UserID FROM Notifications WHERE NotificationID = @notificationId
            `);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (checkResult.recordset[0].UserID !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Mark as read
        await pool.request()
            .input('notificationId', sql.Int, notificationId)
            .query(`
                UPDATE Notifications
                SET IsRead = 1
                WHERE NotificationID = @notificationId
            `);

        console.log(`✅ Notification ${notificationId} marked as read`);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// PUT /api/notifications/read-all - Mark all notifications as read
app.put('/api/notifications/read-all', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        console.log(`📬 Mark all notifications as read for user ${req.user.id}`);

        const pool = await getPool();
        await pool.request()
            .input('userId', sql.Int, req.user.id)
            .query(`
                UPDATE Notifications
                SET IsRead = 1
                WHERE UserID = @userId AND IsRead = 0
            `);

        console.log(`✅ All notifications marked as read for user ${req.user.id}`);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
});

// ==================== EVENT INVITATION ENDPOINTS ====================

// POST /api/events/:id/invite - Send invitations to colleagues
app.post('/api/events/:id/invite', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const eventId = parseInt(req.params.id);
        const { userIds, message } = req.body; // userIds is an array
        const inviterUserId = req.user.id;

        console.log(`📨 Sending invitations for event ${eventId} from user ${inviterUserId}`);

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one user to invite'
            });
        }

        const pool = await getPool();

        // Verify event exists
        const eventResult = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query('SELECT EventID, Title FROM Events WHERE EventID = @eventId');

        if (eventResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const event = eventResult.recordset[0];
        const invitations = [];
        const notifications = [];

        // Create invitations and notifications for each user
        for (const inviteeUserId of userIds) {
            try {
                // Insert invitation
                const inviteResult = await pool.request()
                    .input('eventId', sql.Int, eventId)
                    .input('inviterUserId', sql.Int, inviterUserId)
                    .input('inviteeUserId', sql.Int, inviteeUserId)
                    .input('message', sql.NVarChar, message || null)
                    .query(`
                        INSERT INTO EventInvitations (EventID, InviterUserID, InviteeUserID, Message)
                        OUTPUT INSERTED.*
                        VALUES (@eventId, @inviterUserId, @inviteeUserId, @message)
                    `);

                if (inviteResult.recordset.length > 0) {
                    invitations.push(inviteResult.recordset[0]);

                    // Create notification
                    await pool.request()
                        .input('userId', sql.Int, inviteeUserId)
                        .input('type', sql.NVarChar, 'event_invitation')
                        .input('title', sql.NVarChar, 'Event Invitation')
                        .input('message', sql.NVarChar, `You've been invited to "${event.Title}"${message ? `: ${message}` : ''}`)
                        .input('entityType', sql.NVarChar, 'invitation')
                        .input('entityId', sql.Int, inviteResult.recordset[0].InvitationID)
                        .input('actionURL', sql.NVarChar, `/events/${eventId}`)
                        .query(`
                            INSERT INTO Notifications (UserID, Type, Title, Message, RelatedEntityType, RelatedEntityID, ActionURL)
                            VALUES (@userId, @type, @title, @message, @entityType, @entityId, @actionURL)
                        `);
                }
            } catch (error) {
                // Skip if invitation already exists (unique constraint violation)
                if (error.number !== 2627) {
                    console.error(`Error inviting user ${inviteeUserId}:`, error);
                }
            }
        }

        res.json({
            success: true,
            message: `Invitations sent to ${invitations.length} user(s)`,
            data: invitations
        });
    } catch (error) {
        console.error('Error sending invitations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send invitations'
        });
    }
});

// GET /api/invitations/received - Get invitations received by current user
app.get('/api/invitations/received', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const userId = req.user.id;

        console.log(`📨 Getting invitations for user ${userId}`);

        const pool = await getPool();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT
                    i.InvitationID,
                    i.EventID,
                    i.Status,
                    i.Message,
                    i.CreatedAt,
                    i.RespondedAt,
                    e.Title as EventTitle,
                    e.StartDateTime,
                    e.Location,
                    u.FirstName as InviterFirstName,
                    u.LastName as InviterLastName
                FROM EventInvitations i
                INNER JOIN Events e ON i.EventID = e.EventID
                INNER JOIN Users u ON i.InviterUserID = u.UserID
                WHERE i.InviteeUserID = @userId
                ORDER BY i.CreatedAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invitations'
        });
    }
});

// PUT /api/invitations/:id/respond - Accept or decline invitation
app.put('/api/invitations/:id/respond', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const invitationId = parseInt(req.params.id);
        const { status } = req.body; // 'Accepted' or 'Declined'
        const userId = req.user.id;

        console.log(`📨 Responding to invitation ${invitationId}: ${status}`);

        if (!['Accepted', 'Declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "Accepted" or "Declined"'
            });
        }

        const pool = await getPool();

        // Get invitation details
        const invitationResult = await pool.request()
            .input('invitationId', sql.Int, invitationId)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT i.*, e.Title as EventTitle, e.MaxParticipants,
                       (SELECT COUNT(*) FROM EventRegistrations WHERE EventID = i.EventID AND Status = 'Registered') as CurrentParticipants
                FROM EventInvitations i
                INNER JOIN Events e ON i.EventID = e.EventID
                WHERE i.InvitationID = @invitationId AND i.InviteeUserID = @userId
            `);

        if (invitationResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        const invitation = invitationResult.recordset[0];

        // Update invitation status
        await pool.request()
            .input('invitationId', sql.Int, invitationId)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE EventInvitations
                SET Status = @status, RespondedAt = GETUTCDATE()
                WHERE InvitationID = @invitationId
            `);

        // If accepted, register user for the event
        if (status === 'Accepted') {
            // Check if event is full
            if (invitation.CurrentParticipants >= invitation.MaxParticipants) {
                return res.status(400).json({
                    success: false,
                    message: 'Event is already full'
                });
            }

            // Register user for event
            try {
                await pool.request()
                    .input('eventId', sql.Int, invitation.EventID)
                    .input('userId', sql.Int, userId)
                    .query(`
                        INSERT INTO EventRegistrations (EventID, UserID, Status)
                        VALUES (@eventId, @userId, 'Registered')
                    `);

                // Create notification for successful registration
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('type', sql.NVarChar, 'event_registered')
                    .input('title', sql.NVarChar, 'Event Registration Confirmed')
                    .input('message', sql.NVarChar, `You've successfully registered for "${invitation.EventTitle}"`)
                    .input('entityType', sql.NVarChar, 'event')
                    .input('entityId', sql.Int, invitation.EventID)
                    .input('actionURL', sql.NVarChar, `/events/${invitation.EventID}`)
                    .query(`
                        INSERT INTO Notifications (UserID, Type, Title, Message, RelatedEntityType, RelatedEntityID, ActionURL)
                        VALUES (@userId, @type, @title, @message, @entityType, @entityId, @actionURL)
                    `);
            } catch (error) {
                if (error.number === 2627) {
                    // Already registered
                    return res.json({
                        success: true,
                        message: 'Invitation accepted. You were already registered for this event.'
                    });
                }
                throw error;
            }
        }

        res.json({
            success: true,
            message: `Invitation ${status.toLowerCase()}`,
            data: { invitationId, status }
        });
    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to invitation'
        });
    }
});

// GET /api/users/search - Search users to invite
app.get('/api/users/search', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        console.log(`🔍 Searching users: ${query}`);

        const pool = await getPool();
        const result = await pool.request()
            .input('searchTerm', sql.NVarChar, `%${query}%`)
            .input('currentUserId', sql.Int, req.user.id)
            .query(`
                SELECT TOP 20
                    UserID,
                    FirstName,
                    LastName,
                    Email,
                    Department,
                    Location
                FROM Users
                WHERE IsActive = 1
                AND UserID != @currentUserId
                AND (
                    FirstName LIKE @searchTerm
                    OR LastName LIKE @searchTerm
                    OR Email LIKE @searchTerm
                )
                ORDER BY FirstName, LastName
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search users'
        });
    }
});

// ==================== EVENT FEEDBACK ENDPOINTS ====================

// POST /api/events/:id/feedback - Submit feedback for an event
app.post('/api/events/:id/feedback', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const eventId = parseInt(req.params.id);
        const { rating, comment, wouldRecommend } = req.body;
        const userId = req.user.id;

        console.log(`📝 POST feedback for event ${eventId} by user ${userId}`);

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if user attended the event
        const pool = await getPool();
        const participantCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT * FROM EventParticipants
                WHERE EventID = @eventId AND UserID = @userId
                AND Status IN ('registered', 'confirmed', 'attended')
            `);

        if (participantCheck.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You must register for the event to leave feedback'
            });
        }

        // Check if feedback already exists
        const existingFeedback = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM EventFeedback WHERE EventID = @eventId AND UserID = @userId');

        if (existingFeedback.recordset.length > 0) {
            // Update existing feedback
            await pool.request()
                .input('eventId', sql.Int, eventId)
                .input('userId', sql.Int, userId)
                .input('rating', sql.Int, rating)
                .input('comment', sql.NVarChar(1000), comment || null)
                .input('wouldRecommend', sql.Bit, wouldRecommend !== false ? 1 : 0)
                .query(`
                    UPDATE EventFeedback
                    SET Rating = @rating, Comment = @comment, WouldRecommend = @wouldRecommend, UpdatedAt = GETUTCDATE()
                    WHERE EventID = @eventId AND UserID = @userId
                `);

            console.log(`✅ Feedback updated for event ${eventId}`);

            return res.json({
                success: true,
                message: 'Feedback updated successfully'
            });
        } else {
            // Insert new feedback
            await pool.request()
                .input('eventId', sql.Int, eventId)
                .input('userId', sql.Int, userId)
                .input('rating', sql.Int, rating)
                .input('comment', sql.NVarChar(1000), comment || null)
                .input('wouldRecommend', sql.Bit, wouldRecommend !== false ? 1 : 0)
                .query(`
                    INSERT INTO EventFeedback (EventID, UserID, Rating, Comment, WouldRecommend)
                    VALUES (@eventId, @userId, @rating, @comment, @wouldRecommend)
                `);

            console.log(`✅ Feedback submitted for event ${eventId}`);

            return res.json({
                success: true,
                message: 'Feedback submitted successfully'
            });
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback'
        });
    }
});

// GET /api/events/:id/feedback - Get all feedback for an event
app.get('/api/events/:id/feedback', async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const eventId = parseInt(req.params.id);

        console.log(`📊 GET feedback for event ${eventId}`);

        const pool = await getPool();
        const result = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT
                    ef.FeedbackID,
                    ef.Rating,
                    ef.Comment,
                    ef.WouldRecommend,
                    ef.CreatedAt,
                    ef.UpdatedAt,
                    u.FirstName,
                    u.LastName,
                    u.Email
                FROM EventFeedback ef
                INNER JOIN Users u ON ef.UserID = u.UserID
                WHERE ef.EventID = @eventId
                ORDER BY ef.CreatedAt DESC
            `);

        console.log(`✅ Found ${result.recordset.length} feedback entries`);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback'
        });
    }
});

// GET /api/events/:id/feedback/stats - Get feedback statistics
app.get('/api/events/:id/feedback/stats', async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const eventId = parseInt(req.params.id);

        console.log(`📊 GET feedback stats for event ${eventId}`);

        const pool = await getPool();
        const result = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT
                    COUNT(*) as TotalFeedback,
                    AVG(CAST(Rating as FLOAT)) as AverageRating,
                    SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as FiveStars,
                    SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as FourStars,
                    SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as ThreeStars,
                    SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as TwoStars,
                    SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as OneStar,
                    SUM(CASE WHEN WouldRecommend = 1 THEN 1 ELSE 0 END) as WouldRecommend,
                    SUM(CASE WHEN WouldRecommend = 0 THEN 1 ELSE 0 END) as WouldNotRecommend
                FROM EventFeedback
                WHERE EventID = @eventId
            `);

        const stats = result.recordset[0];

        console.log(`✅ Stats: ${stats.TotalFeedback} feedback, avg ${stats.AverageRating?.toFixed(1)} stars`);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching feedback stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback statistics'
        });
    }
});

// GET /api/events/:id/feedback/my - Get current user's feedback for an event
app.get('/api/events/:id/feedback/my', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const eventId = parseInt(req.params.id);
        const userId = req.user.id;

        console.log(`📝 GET my feedback for event ${eventId}`);

        const pool = await getPool();
        const result = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT
                    FeedbackID,
                    Rating,
                    Comment,
                    WouldRecommend,
                    CreatedAt,
                    UpdatedAt
                FROM EventFeedback
                WHERE EventID = @eventId AND UserID = @userId
            `);

        if (result.recordset.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No feedback found'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error fetching user feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback'
        });
    }
});

// DELETE /api/events/:id/feedback - Delete feedback
app.delete('/api/events/:id/feedback', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const eventId = parseInt(req.params.id);
        const userId = req.user.id;

        console.log(`🗑️ DELETE feedback for event ${eventId} by user ${userId}`);

        const pool = await getPool();

        // Check if feedback exists
        const existingFeedback = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM EventFeedback WHERE EventID = @eventId AND UserID = @userId');

        if (existingFeedback.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        // Delete feedback
        await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('DELETE FROM EventFeedback WHERE EventID = @eventId AND UserID = @userId');

        console.log(`✅ Feedback deleted`);

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback'
        });
    }
});

// =============================================================================
// USER PROFILE ENDPOINTS
// =============================================================================

// Update user profile
app.put('/api/profile', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const { firstName, lastName, department, location, interests, bio } = req.body;
        const userId = req.user.id;

        console.log('📝 Updating profile for user:', userId);

        // Validate required fields
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required'
            });
        }

        // Build update query
        const pool = await getPool();
        let query = `
            UPDATE Users
            SET FirstName = @firstName,
                LastName = @lastName,
                Department = @department,
                Location = @location,
                Interests = @interests,
                Bio = @bio
            WHERE UserID = @userId
        `;

        const request = pool.request()
            .input('userId', sql.Int, userId)
            .input('firstName', sql.NVarChar, firstName)
            .input('lastName', sql.NVarChar, lastName)
            .input('department', sql.NVarChar, department || null)
            .input('location', sql.NVarChar, location || null)
            .input('interests', sql.NVarChar, interests || null)
            .input('bio', sql.NVarChar, bio || null);

        await request.query(query);

        // Fetch updated user data
        const userResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, Department, Location, Interests, Bio
                FROM Users
                WHERE UserID = @userId
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = userResult.recordset[0];

        console.log(`✅ Profile updated for user: ${userId}`);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: updatedUser.UserID,
                email: updatedUser.Email,
                firstName: updatedUser.FirstName,
                lastName: updatedUser.LastName,
                role: updatedUser.Role,
                department: updatedUser.Department,
                location: updatedUser.Location,
                interests: updatedUser.Interests ? updatedUser.Interests.split(',').map(i => i.trim()) : [],
                bio: updatedUser.Bio
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const { getPool, sql } = require('./database');
        const userId = req.user.id;

        const pool = await getPool();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, Department, Location, Interests, Bio
                FROM Users
                WHERE UserID = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.recordset[0];

        res.json({
            success: true,
            data: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role,
                department: user.Department,
                location: user.Location,
                interests: user.Interests ? user.Interests.split(',').map(i => i.trim()) : [],
                bio: user.Bio
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
    console.log(`✅ Real server running on port ${PORT}`);
    console.log(`✅ Test it at: http://localhost:${PORT}/api/test`);
    
    // Test database connection
    try {
        const { getPool } = require('./database');
        await getPool();
        console.log(`✅ Database connected successfully`);
    } catch (error) {
        console.error(`❌ Database connection failed:`, error.message);
    }
});