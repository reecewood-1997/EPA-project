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
  Chip,
  OutlinedInput,
  Grid,
  Divider,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Event } from '../types/event';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateEvent: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [tags, setTags] = useState<string[]>([]);
  const [eventData, setEventData] = useState<Partial<Event>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    category: '',
    maxParticipants: 10,
    requirements: '',
    objectives: '',
    contactEmail: user?.email || '',
    contactPhone: '',
  });

  const handleChange = (field: keyof Event) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEventData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventToCreate = {
        ...eventData,
        id: Date.now(), // Generate a temporary ID
        tags,
        createdBy: user,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      try {
        // Get user token for authentication
        const token = localStorage.getItem('token');
        const headers = token ? {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        } : {
          'Content-Type': 'application/json'
        };

        // Try to create via backend first
        const response = await axios.post('http://localhost:5000/api/events', eventToCreate, {
          headers
        });

        if (response.data.success) {
          alert('Event created successfully!');
        }
      } catch (backendError: any) {
        // Backend not available, store locally for now
        console.log('Backend not available, event created locally', backendError.message);
        
        // Store in localStorage for now (will be replaced by backend later)
        const existingEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
        existingEvents.push(eventToCreate);
        localStorage.setItem('mockEvents', JSON.stringify(existingEvents));
        
        // Show success message
        alert('Event created successfully! (Note: This is stored locally until backend is connected)');
      }
      
      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const handleTagChange = (event: any) => {
    setTags(event.target.value as string[]);
  };

  const categories = [
    'environment',
    'education', 
    'health',
    'community',
    'elderly-care',
    'youth-support',
    'food-security',
    'homelessness',
    'disability-support',
    'mental-health'
  ];

  const availableTags = [
    'outdoor',
    'indoor',
    'remote',
    'physical',
    'technical',
    'creative',
    'leadership',
    'teamwork',
    'weekend',
    'evening',
    'one-time',
    'recurring'
  ];

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Event
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                value={eventData.title}
                onChange={handleChange('title')}
                required
                helperText="A clear, descriptive title for your volunteer event"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={eventData.description}
                onChange={handleChange('description')}
                required
                helperText="Detailed description of the volunteer activity and its impact"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={eventData.category}
                  label="Category"
                  onChange={(e) => setEventData(prev => ({...prev, category: e.target.value}))}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  value={tags}
                  onChange={handleTagChange}
                  input={<OutlinedInput label="Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date and Location */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Date & Location
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date & Time"
                type="datetime-local"
                value={eventData.startDate}
                onChange={handleChange('startDate')}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date & Time"
                type="datetime-local"
                value={eventData.endDate}
                onChange={handleChange('endDate')}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={eventData.location}
                onChange={handleChange('location')}
                required
                helperText="Full address or location details"
              />
            </Grid>

            {/* Participation Details */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Participation Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Participants"
                type="number"
                value={eventData.maxParticipants}
                onChange={handleChange('maxParticipants')}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Requirements"
                value={eventData.requirements}
                onChange={handleChange('requirements')}
                helperText="Any skills, equipment, or qualifications needed"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Objectives"
                multiline
                rows={3}
                value={eventData.objectives}
                onChange={handleChange('objectives')}
                helperText="What you hope to achieve with this volunteer event"
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={eventData.contactEmail}
                onChange={handleChange('contactEmail')}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={eventData.contactPhone}
                onChange={handleChange('contactPhone')}
                helperText="Optional contact number"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/events')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Create Event
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateEvent;
