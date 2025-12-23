import React, { useState, useEffect } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface Category {
  CategoryID: number;
  CategoryName: string;
  Description: string;
  Color: string;
}

const EditEvent: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagsMenuOpen, setTagsMenuOpen] = useState(false);
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

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      
      try {
        const token = localStorage.getItem('token');
        const headers = token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } : { 'Content-Type': 'application/json' };

        const response = await axios.get(`http://localhost:5001/api/events/${eventId}`, { headers });
        if (response.data.success) {
          const event = response.data.data;
          setEventData({
            title: event.Title,
            description: event.Description,
            startDate: event.StartDateTime ? new Date(event.StartDateTime).toISOString().slice(0, 16) : '',
            endDate: event.EndDateTime ? new Date(event.EndDateTime).toISOString().slice(0, 16) : '',
            location: event.Location,
            category: event.CategoryName,
            maxParticipants: event.MaxParticipants,
            requirements: event.RequiredSkills ? JSON.parse(event.RequiredSkills).join(', ') : '',
            objectives: event.Objectives || '',
            contactEmail: event.ContactEmail || user?.email || '',
            contactPhone: event.ContactPhone || '',
          });
          
          if (event.RequiredSkills) {
            setTags(JSON.parse(event.RequiredSkills));
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        alert('Failed to load event data');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, user?.email, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/events/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

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
      const selectedCategory = categories.find(cat => cat.CategoryName === eventData.category);
      const eventToUpdate = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startDateTime: eventData.startDate,
        endDateTime: eventData.endDate,
        maxParticipants: eventData.maxParticipants,
        categoryID: selectedCategory?.CategoryID,
        requiredSkills: tags
      };
      
      try {
        const token = localStorage.getItem('token');
        const headers = token ? {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        } : {
          'Content-Type': 'application/json'
        };

        const response = await axios.put(`http://localhost:5001/api/events/${eventId}`, eventToUpdate, {
          headers
        });

        if (response.data.success) {
          alert('Event updated successfully!');
          navigate('/events');
        }
      } catch (backendError: any) {
        console.error('Backend error:', backendError);
        
        if (backendError.response) {
          alert(`Error updating event: ${backendError.response.data.message || 'Unknown error'}`);
        } else if (backendError.request) {
          alert('Cannot connect to server. Please ensure the server is running.');
        } else {
          alert('Failed to update event. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  const handleTagChange = (event: any) => {
    setTags(event.target.value as string[]);
  };

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

  if (loading) {
    return (
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography>Loading event data...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Event
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
                helperText="Detailed description of the volunteer activity and its impact (minimum 10 characters)"
                error={eventData.description ? eventData.description.length > 0 && eventData.description.length < 10 : false}
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
                    <MenuItem key={cat.CategoryID} value={cat.CategoryName}>
                      {cat.CategoryName}
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
                  open={tagsMenuOpen}
                  onOpen={() => setTagsMenuOpen(true)}
                  onClose={() => setTagsMenuOpen(false)}
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
                  <Box sx={{ p: 1, pt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => setTagsMenuOpen(false)}
                    >
                      Done
                    </Button>
                  </Box>
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
                inputProps={{ min: eventData.startDate }}
                helperText="Must be after start date & time"
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
                  Update Event
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditEvent;