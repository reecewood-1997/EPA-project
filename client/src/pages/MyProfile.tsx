import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
} from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { User } from '../types/event';

const MyProfile: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        {user ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={user.firstName}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={user.lastName}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={user.email}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role"
                value={user.role}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={user.department || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={user.location || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Interests
              </Typography>
              <TextField
                fullWidth
                label="Interests"
                value={user.interests?.join(', ') || ''}
                disabled
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Bio
              </Typography>
              <TextField
                fullWidth
                label="Bio"
                value={user.bio || ''}
                disabled
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        ) : (
          <Typography color="error">
            Please log in to view your profile
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default MyProfile;
