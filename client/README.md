# Frontend - PwC One Firm One Day Platform

> React + TypeScript frontend application for the PwC volunteering platform

## 📋 Overview

The frontend is a modern, responsive single-page application (SPA) built with React 18 and TypeScript. It provides an intuitive interface for PwC employees to discover, join, and manage volunteer events across the UK.

## 🛠️ Tech Stack

- **React** 18.2.0 - UI framework
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** v5 - UI component library
- **Redux Toolkit** - State management
- **React Router** v6 - Client-side routing
- **Axios** - HTTP client for API calls
- **React Big Calendar** - Calendar view component
- **Jest** + **React Testing Library** - Testing framework

## 📁 Project Structure

```
client/
├── public/                 # Static assets
│   └── index.html
├── src/
│   ├── components/        # Reusable React components
│   │   ├── EventCard.tsx
│   │   ├── FeedbackSection.tsx
│   │   ├── InvitationCard.tsx
│   │   ├── InviteColleaguesDialog.tsx
│   │   ├── Layout.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── SimpleEventCard.tsx
│   │
│   ├── pages/             # Page-level components
│   │   ├── AdminDashboard.tsx
│   │   ├── Calendar.tsx
│   │   ├── CreateEvent.tsx
│   │   ├── CreateIdea.tsx
│   │   ├── EditEvent.tsx
│   │   ├── EventDetail.tsx
│   │   ├── Events.tsx
│   │   ├── IdeaDetail.tsx
│   │   ├── Ideas.tsx
│   │   ├── Login.tsx
│   │   └── MyProfile.tsx
│   │
│   ├── store/             # Redux store configuration
│   │   ├── index.ts       # Store setup
│   │   ├── authSlice.ts   # Authentication state
│   │   └── hooks.ts       # Typed Redux hooks
│   │
│   ├── hooks/             # Custom React hooks
│   │   └── useEvents.ts
│   │
│   ├── types/             # TypeScript type definitions
│   │   └── event.ts
│   │
│   ├── App.tsx            # Main application component
│   ├── index.tsx          # Application entry point
│   └── setupTests.ts      # Jest configuration
│
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher

### Installation

1. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Configure `.env` file**
   ```env
   REACT_APP_API_URL=http://localhost:5001/api
   REACT_APP_ENV=development
   ```

### Running the Application

```bash
# Start development server
npm start

# Application runs on http://localhost:3000
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Build output in /build directory
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test EventCard.test.tsx
```

### Test Coverage

- **143 automated tests** across components and pages
- **All critical user flows** tested
- **95%+ code coverage** on tested components

### Test Files

All test files follow the pattern `*.test.tsx`:
- `src/components/*.test.tsx` - Component tests
- `src/pages/*.test.tsx` - Page tests

Example test suites:
- EventCard: 11 tests (render, join, leave, full state, etc.)
- Login: 12 tests (auth, registration, validation)
- Events: 11 tests (search, filter, display)
- FeedbackSection: 14 tests (CRUD operations)

## 📦 Key Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^4.9.5",
  "@mui/material": "^5.14.0",
  "@reduxjs/toolkit": "^1.9.5",
  "react-router-dom": "^6.14.0",
  "axios": "^1.4.0",
  "react-big-calendar": "^1.8.0"
}
```

## 🔧 Development Tools

### Available Scripts

```bash
npm start          # Start development server
npm test           # Run tests
npm run build      # Create production build
npm run eject      # Eject from Create React App (irreversible)
```

### Code Quality

```bash
# TypeScript type checking
npx tsc --noEmit

# Format code (if using Prettier)
npm run format
```

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach using Material-UI breakpoints
- Optimized for desktop, tablet, and mobile devices
- Touch-friendly interface elements

### Theme
- Material Design principles
- PwC brand colors (can be customized)
- Consistent spacing and typography

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatible
- High contrast color schemes

## 🔐 Authentication

### JWT Token Management
- Tokens stored in localStorage
- Automatic inclusion in API requests via Axios interceptors
- Token expiry handling with automatic logout
- Protected routes using `ProtectedRoute` component

### User Roles
- **Employee** - Standard user access
- **Admin** - Additional administrative features

## 📡 API Integration

### Base URL Configuration
Set in `.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
```

### API Endpoints Used

```typescript
// Events
GET    /events                    // List all events
GET    /events/:id                // Get event details
POST   /events                    // Create event
PUT    /events/:id                // Update event
DELETE /events/:id                // Delete event
POST   /events/:id/register       // Join event
DELETE /events/:id/unregister     // Leave event

// Ideas
GET    /ideas                     // List all ideas
POST   /ideas                     // Create idea
GET    /ideas/:id                 // Get idea details
POST   /ideas/:id/vote            // Vote on idea

// Feedback
GET    /events/:id/feedback       // Get event feedback
POST   /events/:id/feedback       // Submit feedback
PUT    /events/:id/feedback       // Update feedback
DELETE /events/:id/feedback       // Delete feedback

// Invitations
GET    /invitations/received      // Get user's invitations
POST   /invitations               // Send invitation
PUT    /invitations/:id           // Respond to invitation

// Auth
POST   /auth/login                // User login
POST   /auth/register             // User registration
```

## 🗺️ Routing

### Public Routes
- `/` - Landing page / Login
- `/login` - Authentication page

### Protected Routes (Require Authentication)
- `/events` - Browse all events
- `/events/:id` - Event details
- `/events/create` - Create new event
- `/events/:id/edit` - Edit event
- `/ideas` - Browse ideas
- `/ideas/:id` - Idea details
- `/ideas/create` - Create new idea
- `/calendar` - Calendar view
- `/profile` - User profile
- `/admin` - Admin dashboard (Admin only)

## 🌍 UK-Specific Features

### Location Data
- UK cities: London, Manchester, Birmingham
- Specific areas: Camden, Brighton, Peckham, Greenwich, etc.
- "Near Me" geolocation for UK locations

### Date/Time Formatting
- UK date format (DD/MM/YYYY)
- 24-hour time format
- British English language

## 🐛 Common Issues & Solutions

### Issue: API connection refused
**Solution:** Ensure backend server is running on port 5001
```bash
cd ../server
npm run dev
```

### Issue: Tests failing due to missing dependencies
**Solution:** Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors in tests
**Solution:** Ensure @types packages are installed
```bash
npm install --save-dev @types/jest @types/node @types/react @types/react-dom
```

## 📝 Code Style

### TypeScript Conventions
- Use functional components with hooks
- Define interfaces for all props
- Use typed Redux hooks from `store/hooks.ts`
- Avoid `any` type where possible

### Component Structure
```typescript
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

## 🔄 State Management

### Redux Store Structure
```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    loading: boolean,
    error: string | null
  }
}
```

### Usage Example
```typescript
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { login, logout } from '../store/authSlice';

const user = useAppSelector((state) => state.auth.user);
const dispatch = useAppDispatch();
```

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Documentation](https://mui.com/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Testing Library](https://testing-library.com/react)

## 🤝 Contributing

This is an EPA final project. For development guidelines:

1. Follow existing code structure
2. Write tests for new features
3. Use TypeScript for type safety
4. Follow Material-UI theming conventions
5. Maintain UK-specific context

## 📄 License

Part of academic submission for PwC UK Software Engineering Degree Apprenticeship.

---

**For backend documentation, see [../server/README.md](../server/README.md)**
