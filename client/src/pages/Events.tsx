import React, { useState } from 'react';
import {
  Container,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import EventCard from '../components/EventCard';
import { useAppSelector } from '../store/hooks';
import { Event } from '../types/event';
import { Participant } from '../types/event';
import { useEvents } from '../hooks/useEvents';

const Events: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const { events, loading, error } = useEvents();

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || event.category === category;
    const matchesLocation = !location || event.location === location;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Volunteer Events
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as string)}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="environment">Environment</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="health">Health</MenuItem>
              <MenuItem value="community">Community</MenuItem>
              <MenuItem value="elderly-care">Elderly Care</MenuItem>
              <MenuItem value="youth-support">Youth Support</MenuItem>
              <MenuItem value="food-security">Food Security</MenuItem>
              <MenuItem value="homelessness">Homelessness</MenuItem>
              <MenuItem value="disability-support">Disability Support</MenuItem>
              <MenuItem value="mental-health">Mental Health</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={location}
              label="Location"
              onChange={(e) => setLocation(e.target.value as string)}
            >
              <MenuItem value="">All Locations</MenuItem>
              <MenuItem value="London">London</MenuItem>
              <MenuItem value="Manchester">Manchester</MenuItem>
              <MenuItem value="Birmingham">Birmingham</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {filteredEvents.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <EventCard event={event as Event} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Events;
