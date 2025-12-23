import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/authSlice';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    department: '',
    location: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [passwordTouched, setPasswordTouched] = useState(false);
  
  const departments = [
    'HR',
    'IT', 
    'Accounting',
    'Audit',
    'Finance',
    'Deals',
    'Risk',
    'Tax'
  ];

  const passwordRequirements = {
    minLength: credentials.password.length >= 8,
    hasNumber: /\d/.test(credentials.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(credentials.password),
    hasUpperCase: /[A-Z]/.test(credentials.password),
    hasLowerCase: /[a-z]/.test(credentials.password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(req => req);

  const handleChange = (field: keyof typeof credentials) => (
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

    if (isRegisterMode && !isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      setLoading(false);
      return;
    }
    
    try {
      const endpoint = isRegisterMode ? 'register' : 'login';
      const response = await fetch(`http://localhost:5001/api/auth/${endpoint}`, {
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
      console.error('Auth error:', error);
      
      // Handle different types of errors with user-friendly messages
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please try again later.');
      } else if (error.message?.includes('JSON') || error.message?.includes('Unexpected token')) {
        setError('Server error. Please try again later.');
      } else if (error.message?.includes('401') || error.message?.includes('Invalid')) {
        setError(isRegisterMode ? 'Registration failed. Please check your details.' : 'Invalid email or password.');
      } else {
        setError(isRegisterMode ? 'Registration failed. Please try again.' : 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {isRegisterMode ? 'Register' : 'Login'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Typography color="error" variant="body2" align="center">
                {error}
              </Typography>
            )}
            {isRegisterMode && (
              <>
                <TextField
                  fullWidth
                  label="First Name"
                  value={credentials.firstName}
                  onChange={handleChange('firstName')}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={credentials.lastName}
                  onChange={handleChange('lastName')}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={credentials.department}
                    label="Department"
                    onChange={(e) => setCredentials(prev => ({ ...prev, department: e.target.value }))}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Location"
                  value={credentials.location}
                  onChange={handleChange('location')}
                />
              </>
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
              onFocus={() => setPasswordTouched(true)}
              required
              error={!!error || (isRegisterMode && passwordTouched && !isPasswordValid)}
              helperText={
                isRegisterMode && passwordTouched && !isPasswordValid
                  ? "Password must meet all requirements below"
                  : ""
              }
            />
            {isRegisterMode && passwordTouched && (
              <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Password Requirements:
                </Typography>
                <Typography variant="body2" color={passwordRequirements.minLength ? 'success.main' : 'error.main'}>
                  {passwordRequirements.minLength ? '✓' : '✗'} At least 8 characters
                </Typography>
                <Typography variant="body2" color={passwordRequirements.hasUpperCase ? 'success.main' : 'error.main'}>
                  {passwordRequirements.hasUpperCase ? '✓' : '✗'} One uppercase letter
                </Typography>
                <Typography variant="body2" color={passwordRequirements.hasLowerCase ? 'success.main' : 'error.main'}>
                  {passwordRequirements.hasLowerCase ? '✓' : '✗'} One lowercase letter
                </Typography>
                <Typography variant="body2" color={passwordRequirements.hasNumber ? 'success.main' : 'error.main'}>
                  {passwordRequirements.hasNumber ? '✓' : '✗'} One number
                </Typography>
                <Typography variant="body2" color={passwordRequirements.hasSpecialChar ? 'success.main' : 'error.main'}>
                  {passwordRequirements.hasSpecialChar ? '✓' : '✗'} One special character (!@#$%^&*)
                </Typography>
              </Box>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              disabled={loading}
              size="large"
            >
              {loading 
                ? (isRegisterMode ? 'Creating Account...' : 'Signing in...') 
                : (isRegisterMode ? 'Create Account' : 'Sign In')
              }
            </Button>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              sx={{ mt: 1 }}
            >
              {isRegisterMode ? 'Already have an account? Sign In' : 'Need an account? Register'}
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
