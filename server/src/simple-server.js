// Simple JavaScript server to test basic functionality
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Simple login route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock successful login
  res.json({ 
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 1,
        email: email,
        firstName: 'Demo',
        lastName: 'User',
        role: 'employee',
        department: 'Technology',
        location: 'London'
      },
      token: 'demo-jwt-token-12345'
    }
  });
});

// Simple register route
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, department, location } = req.body;
  
  // Mock successful registration
  res.json({ 
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: 2,
        email: email,
        firstName: firstName || 'New',
        lastName: lastName || 'User',
        role: 'employee',
        department: department || 'General',
        location: location || 'London'
      },
      token: 'demo-jwt-token-67890'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Test it at: http://localhost:${PORT}/api/test`);
});