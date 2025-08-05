import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { logout } from '../store/authSlice';
import { RootState } from '../store';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            <RouterLink to={user ? "/events" : "/"} style={{ textDecoration: 'none', color: 'inherit' }}>
              PwC One Firm One Day
            </RouterLink>
          </Typography>
          {user && (
            <Box>
              <Button
                color="inherit"
                sx={{ mr: 2 }}
                onClick={() => window.location.href = '/events/create'}
              >
                Create Event
              </Button>
              <Button
                color="inherit"
                sx={{ mr: 2 }}
                onClick={() => window.location.href = '/profile'}
              >
                Profile
              </Button>
              <Button
                color="inherit"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
