import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/authSlice';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: 'email' | 'password') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.data) {
        dispatch(login({ 
          user: data.data.user, 
          token: data.data.token 
        }));
        navigate('/events');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      // Fallback to demo login if backend is not available
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        console.log('Backend not available, using demo login');
        const mockUser = {
          id: 1,
          email: credentials.email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'employee',
          department: 'Technology',
          location: 'London'
        };
        const mockToken = 'demo-jwt-token';
        dispatch(login({ user: mockUser, token: mockToken }));
        navigate('/events');
      } else {
        setError(error.message || 'Invalid email or password. Please try again.');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Typography color="error" variant="body2" align="center">
                {error}
              </Typography>
            )}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={credentials.email}
              onChange={handleChange('email')}
              required
              error={!!error}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.password}
              onChange={handleChange('password')}
              required
              error={!!error}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              disabled={loading}
              size="large"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Typography variant="body2" color="text.secondary" align="center">
              Demo: Use any email and password to sign in
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
