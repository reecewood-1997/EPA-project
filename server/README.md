# Backend - PwC One Firm One Day Platform

> Node.js + Express backend API for the PwC volunteering platform

## 📋 Overview

The backend is a RESTful API built with Node.js and Express.js, providing secure endpoints for event management, user authentication, feedback collection, and colleague invitations. It uses Microsoft SQL Server for data persistence and implements JWT-based authentication.

## 🛠️ Tech Stack

- **Node.js** v18+ - Runtime environment
- **Express.js** - Web application framework
- **Microsoft SQL Server** - Relational database
- **mssql** - SQL Server driver for Node.js
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📁 Project Structure

```
server/
├── src/
│   ├── config.ts          # Configuration settings
│   ├── database.js        # Database connection
│   ├── index.ts           # Main application file
│   ├── routes/            # API route definitions
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware (auth, etc.)
│   └── models/            # Database models/queries
│
├── sql/                   # Database scripts
│   ├── schema.sql         # Table definitions
│   └── seed.sql           # Sample data (optional)
│
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json          # TypeScript configuration
├── Postman-Collection.json # API testing collection
├── API-TESTING-GUIDE.md   # API testing documentation
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
- Microsoft SQL Server 2019 or higher
- SQL Server Management Studio (SSMS) - recommended

### Installation

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Configure `.env` file**
   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development

   # Database Configuration
   DB_SERVER=localhost
   DB_NAME=PwC_Volunteering
   DB_USER=sa
   DB_PASSWORD=your_password_here
   DB_PORT=1433
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=true

   # JWT Configuration
   JWT_SECRET=your_secret_key_here_change_in_production
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # Connect to SQL Server using SSMS or sqlcmd
   sqlcmd -S localhost -U sa -P your_password

   # Create database
   CREATE DATABASE PwC_Volunteering;
   GO

   # Run schema scripts from sql/ folder
   ```

### Running the Server

```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start

# Server runs on http://localhost:5001
```

## 🗄️ Database Schema

### Tables

#### Users
```sql
UserID (PK, INT, IDENTITY)
FirstName (NVARCHAR(100))
LastName (NVARCHAR(100))
Email (NVARCHAR(255), UNIQUE)
PasswordHash (NVARCHAR(255))
Department (NVARCHAR(100))
Location (NVARCHAR(100))
Role (NVARCHAR(50)) -- 'employee' or 'admin'
CreatedAt (DATETIME, DEFAULT GETDATE())
```

#### Events
```sql
EventID (PK, INT, IDENTITY)
Title (NVARCHAR(255))
Description (NVARCHAR(MAX))
StartDateTime (DATETIME)
EndDateTime (DATETIME)
Location (NVARCHAR(255))
MaxParticipants (INT)
CategoryID (FK, INT)
CreatedBy (FK, INT)
CreatedAt (DATETIME)
UpdatedAt (DATETIME)
```

#### Categories
```sql
CategoryID (PK, INT, IDENTITY)
CategoryName (NVARCHAR(100))
Description (NVARCHAR(500))
Color (NVARCHAR(50))
```

#### EventParticipants
```sql
ParticipantID (PK, INT, IDENTITY)
EventID (FK, INT)
UserID (FK, INT)
RegisteredAt (DATETIME)
UNIQUE(EventID, UserID)
```

#### Feedback
```sql
FeedbackID (PK, INT, IDENTITY)
EventID (FK, INT)
UserID (FK, INT)
Rating (INT, 1-5)
Comment (NVARCHAR(MAX))
WouldRecommend (BIT)
CreatedAt (DATETIME)
UpdatedAt (DATETIME)
UNIQUE(EventID, UserID)
```

#### Ideas
```sql
IdeaID (PK, INT, IDENTITY)
Title (NVARCHAR(255))
Description (NVARCHAR(MAX))
CategoryID (FK, INT)
CreatedBy (FK, INT)
Status (NVARCHAR(50)) -- 'pending', 'approved', 'rejected'
CreatedAt (DATETIME)
```

#### Invitations
```sql
InvitationID (PK, INT, IDENTITY)
EventID (FK, INT)
InviterID (FK, INT)
InviteeID (FK, INT)
Status (NVARCHAR(50)) -- 'Pending', 'Accepted', 'Declined'
CreatedAt (DATETIME)
RespondedAt (DATETIME)
```

#### Notifications
```sql
NotificationID (PK, INT, IDENTITY)
UserID (FK, INT)
Type (NVARCHAR(100))
Message (NVARCHAR(500))
IsRead (BIT, DEFAULT 0)
CreatedAt (DATETIME)
```

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                 [Protected]
```

### Events

```
GET    /api/events                  [Public]
GET    /api/events/:id              [Public]
POST   /api/events                  [Protected]
PUT    /api/events/:id              [Protected, Owner/Admin]
DELETE /api/events/:id              [Protected, Owner/Admin]
GET    /api/events/categories       [Public]
POST   /api/events/:id/register     [Protected]
DELETE /api/events/:id/unregister   [Protected]
GET    /api/events/:id/participants [Public]
```

### Ideas

```
GET    /api/ideas                   [Public]
GET    /api/ideas/:id               [Public]
POST   /api/ideas                   [Protected]
PUT    /api/ideas/:id               [Protected, Owner/Admin]
DELETE /api/ideas/:id               [Protected, Owner/Admin]
POST   /api/ideas/:id/vote          [Protected]
```

### Feedback

```
GET    /api/events/:id/feedback         [Public]
GET    /api/events/:id/feedback/my      [Protected]
POST   /api/events/:id/feedback         [Protected]
PUT    /api/events/:id/feedback         [Protected]
DELETE /api/events/:id/feedback         [Protected]
GET    /api/events/:id/feedback/stats   [Public]
```

### Invitations

```
GET    /api/invitations/received    [Protected]
GET    /api/invitations/sent        [Protected]
POST   /api/invitations             [Protected]
PUT    /api/invitations/:id         [Protected]
DELETE /api/invitations/:id         [Protected, Owner]
```

### Notifications

```
GET    /api/notifications           [Protected]
PUT    /api/notifications/:id/read  [Protected]
PUT    /api/notifications/read-all  [Protected]
DELETE /api/notifications/:id       [Protected]
```

### Users

```
GET    /api/users                   [Protected, Admin]
GET    /api/users/:id               [Protected]
PUT    /api/users/:id               [Protected, Self/Admin]
GET    /api/users/colleagues        [Protected]
```

## 🔐 Authentication & Authorization

### JWT Token Structure

```json
{
  "userId": 1,
  "email": "user@pwc.com",
  "role": "employee",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Protected Routes

Use `authMiddleware` to protect endpoints:

```javascript
const authMiddleware = require('./middleware/auth');

router.get('/protected', authMiddleware, (req, res) => {
  // req.user contains decoded JWT payload
  res.json({ user: req.user });
});
```

### Authorization Levels

1. **Public** - No authentication required
2. **Protected** - Requires valid JWT token
3. **Owner** - Requires ownership of resource
4. **Admin** - Requires admin role

## 📝 Request/Response Examples

### Register User

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@pwc.com",
  "password": "SecurePass123!",
  "department": "IT",
  "location": "London"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@pwc.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Create Event

**Request:**
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Beach Cleanup Brighton",
  "description": "Help clean up Brighton Beach",
  "startDateTime": "2026-06-15T10:00:00",
  "endDateTime": "2026-06-15T14:00:00",
  "location": "Brighton Beach",
  "maxParticipants": 20,
  "categoryID": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "EventID": 123,
    "Title": "Beach Cleanup Brighton",
    "CreatedBy": 1,
    "CreatedAt": "2025-11-27T12:00:00Z"
  }
}
```

## 🧪 API Testing

### Using Postman

1. **Import collection**
   ```bash
   # Import Postman-Collection.json into Postman
   ```

2. **Set environment variables**
   - `baseUrl`: http://localhost:5001
   - `token`: (will be set automatically after login)

3. **Run collection**
   - Tests are organized by feature
   - Follow test order for proper workflow

### Using PowerShell Script

```bash
# Run API tests
./test-api.ps1
```

See [API-TESTING-GUIDE.md](./API-TESTING-GUIDE.md) for detailed testing instructions.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5001 | No |
| `NODE_ENV` | Environment | development | No |
| `DB_SERVER` | SQL Server host | localhost | Yes |
| `DB_NAME` | Database name | PwC_Volunteering | Yes |
| `DB_USER` | Database user | sa | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `JWT_EXPIRES_IN` | Token expiry | 7d | No |
| `ALLOWED_ORIGINS` | CORS origins | http://localhost:3000 | No |

### Database Connection

Connection pooling is configured in `database.js`:

```javascript
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};
```

## 🐛 Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 📊 Logging

### Development Logging

```bash
# Logs include:
- Incoming requests (method, path)
- Database queries
- Authentication attempts
- Errors with stack traces
```

### Production Logging

Consider adding:
- Winston for structured logging
- Log rotation
- Error tracking service (e.g., Sentry)

## 🔒 Security Best Practices

✅ **Implemented:**
- Password hashing with bcrypt
- JWT token authentication
- SQL injection prevention (parameterized queries)
- CORS configuration
- Environment variable protection

⚠️ **Recommendations for Production:**
- HTTPS/TLS encryption
- Rate limiting
- Input validation middleware
- Helmet.js for security headers
- SQL Server encryption at rest

## 🚀 Deployment

### Production Checklist

- [ ] Update `.env` with production values
- [ ] Change `JWT_SECRET` to strong random key
- [ ] Set `NODE_ENV=production`
- [ ] Enable SQL Server encryption
- [ ] Configure HTTPS
- [ ] Set up monitoring and logging
- [ ] Enable database backups
- [ ] Configure firewall rules

### Deployment Commands

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start npm --name "pwc-api" -- start
```

## 📈 Performance Optimization

- Database connection pooling enabled
- Indexed foreign keys and frequently queried columns
- Efficient SQL queries with JOINs
- Pagination for large result sets
- Caching considerations for read-heavy endpoints

## 🔄 Database Migrations

For schema changes:

1. Create new migration script in `sql/migrations/`
2. Test on development database
3. Document changes in migration log
4. Apply to production with rollback plan

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [SQL Server Documentation](https://docs.microsoft.com/sql/)
- [JWT Best Practices](https://auth0.com/blog/jwt-handbook/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

## 🤝 Contributing

This is an EPA final project. For development guidelines:

1. Follow existing code structure
2. Use parameterized SQL queries
3. Add error handling for all endpoints
4. Update Postman collection for new endpoints
5. Document API changes

## 📄 License

Part of academic submission for PwC UK Software Engineering Degree Apprenticeship.

---

**For frontend documentation, see [../client/README.md](../client/README.md)**
