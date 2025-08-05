# PwC One Firm One Day Volunteer Platform

A modern web-based platform for managing volunteer events and initiatives at PwC UK.

## Features

- Event Management System
- Idea Submission & Voting
- Advanced Search & Filtering
- Colleague Engagement
- Post-event Feedback
- Role-based Access Control
- Secure Authentication

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: SQL Server
- Authentication: OAuth/Firebase Auth
- Testing: Jest, Selenium
- CI/CD: Azure DevOps

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- SQL Server
- npm or yarn
- Azure DevOps account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Configure your database connection
   - Set up authentication providers

4. Start the development servers:
   ```bash
   # Start backend
   cd server
   npm run dev

   # Start frontend
   cd client
   npm start
   ```

## Project Structure

```
project-root/
├── client/           # React frontend
├── server/           # Node.js backend
├── docs/            # Documentation
└── tests/           # Test files
```

## Contributing

Please follow the project's coding standards and submit pull requests for any changes.

## License

[Your License Here]

## References

- [Project Proposal Document](docs/proposal.pdf)
