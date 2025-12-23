# PwC One Firm One Day Volunteering Platform

> A comprehensive web-based platform designed to enhance PwC UK's One Firm One Day initiative by centralising volunteer event management and maximising employee engagement in local community activities.

**Author:** Reece Wood
**Organisation:** PwC UK
**Programme:** Software Engineering Degree Apprenticeship
**Project Type:** End Point Assessment (EPA) Final Project

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Documentation](#documentation)
- [License](#license)

---

## 🎯 Overview

PwC UK's One Firm One Day is a significant initiative aimed at harnessing the collective efforts of employees to make a substantial impact on local communities through volunteering. This platform addresses the challenge of decentralised volunteer opportunity management by providing a centralised, user-friendly system that:

- Streamlines event coordination and communication
- Increases visibility of volunteer opportunities
- Enhances employee engagement and participation
- Enables post-event feedback and continuous improvement

**Key Statistics:**
- Research shows centralised platforms offering flexible event creation and detailed tracking capabilities demonstrate a **30% increase in volunteer retention and satisfaction**

---

## ✨ Features

### Core Functionality

#### 🗓️ Event Management
- Create, edit, and manage volunteer events with detailed information
- Set maximum participant capacity and track registrations
- Real-time participant management and event status updates
- Event categorisation (Environment, Community, Education, Health, etc.)
- Location-based event discovery (London, Manchester, Birmingham areas)

#### 💡 Innovative Ideas
- Propose new volunteer event ideas
- Community voting and commenting on proposed ideas
- Seamless conversion of approved ideas into events

#### 🔍 Advanced Search & Filtering
- Search events by keyword, category, location, and date
- Filter by upcoming/past events
- Location-based filtering including UK-specific areas (Brighton, Camden, Manchester, etc.)
- "Near Me" geolocation-based event discovery

#### 👥 Colleague Engagement
- Invite colleagues to events via personalised invitations
- RSVP tracking with accept/decline options
- Real-time notifications for invitations and event updates
- Notification bell for all platform activities

#### 📊 Feedback Collection
- Post-event feedback and ratings (1-5 stars)
- Star-based rating system with detailed breakdowns
- "Would recommend" tracking
- Update or delete your own feedback
- View all event reviews and statistics

#### 🔐 Security & Access Control
- Role-based access control (Admin/Employee)
- Secure JWT-based authentication
- Password validation with strength requirements
- Protected routes and authorisation checks

#### 📅 Additional Features
- Calendar view of all volunteering events
- Personal profile management
- Admin dashboard for platform oversight
- Mobile-responsive design
- UK-specific location data

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **UI Library:** Material-UI (MUI) v5
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Calendar:** React Big Calendar
- **Testing:** Jest + React Testing Library
- **Build Tool:** Create React App

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** Microsoft SQL Server
- **Authentication:** JWT (JSON Web Tokens)
- **API Testing:** Postman
- **Environment:** dotenv

### Development Tools
- **Version Control:** Git + GitHub
- **Code Editor:** Visual Studio Code
- **Design:** Figma (wireframes & prototypes)
- **Architecture:** Lucidchart
- **Package Management:** npm

---

## 📁 Project Structure

```
EPA-final-project/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page-level components
│   │   ├── store/         # Redux store and slices
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Node.js backend application
│   ├── src/
│   │   ├── routes/        # API route definitions
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   └── middleware/    # Express middleware
│   ├── sql/               # Database schemas and scripts
│   └── package.json
│
├── docs/                  # Project documentation
├── proposal.js            # Original project proposal
├── TESTING-GUIDE.md       # Comprehensive testing guide
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher
- **Microsoft SQL Server** (2019 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EPA-final-project
   ```

2. **Set up the Frontend**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the Backend**
   ```bash
   cd ../server
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database Setup**
   - Create a new SQL Server database
   - Run the SQL scripts in `server/sql/` to create tables
   - Update connection string in `server/.env`

5. **Start the Development Servers**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Environment Variables

See individual README files in `/client` and `/server` directories for detailed environment variable configuration.

---

## 🧪 Testing

This project includes **comprehensive automated testing** to ensure quality and reliability.

### Test Coverage

- **143 automated tests** covering critical functionality
- **Unit tests** for components and pages
- **Integration tests** for user workflows
- **Jest** for test execution
- **React Testing Library** for component testing

### Running Tests

```bash
cd client
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
```

### Test Highlights

✅ Authentication & Registration
✅ Event Browsing & Filtering
✅ Event Creation & Management
✅ Join/Leave Event Functionality
✅ Feedback System (CRUD operations)
✅ Colleague Invitations
✅ Notifications
✅ Protected Routes & Authorization

**For detailed testing information, see [TESTING-GUIDE.md](./TESTING-GUIDE.md)**

---

## 📚 Documentation

- **[Frontend README](./client/README.md)** - Frontend setup and development
- **[Backend README](./server/README.md)** - Backend setup and API documentation
- **[Testing Guide](./TESTING-GUIDE.md)** - Comprehensive testing documentation
- **[Project Proposal](./proposal.js)** - Original EPA project proposal

---

## 🎓 Project Context

This project was developed as the final End Point Assessment (EPA) for the Software Engineering Degree Apprenticeship at PwC UK. It demonstrates:

- **Full-stack development** with modern web technologies
- **Agile methodology** and iterative development
- **User-centered design** principles
- **Comprehensive testing** strategies
- **Security best practices** and RBAC implementation
- **Real-world business problem** solving

### Risk Mitigation

The project addresses three key risks identified in the proposal:

1. **Insufficient Testing** ✅ - Mitigated with 143 automated tests
2. **Package Vulnerabilities** ✅ - Regular dependency updates and security audits
3. **Low User Engagement** ✅ - Intuitive UI/UX with user-centered design

---

## 📄 License

This project is part of an academic submission for PwC UK Software Engineering Degree Apprenticeship.

---

## 👤 Author

**Reece Wood**
Software Engineering Apprentice
PwC UK

---

## 🙏 Acknowledgments

- PwC UK for the One Firm One Day initiative inspiration
- Software Engineering Pathway instructors and mentors
- React and Node.js open-source communities

---

**Built with ❤️ for making a difference in local communities**
