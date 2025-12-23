import React, { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
// import { Add } from '@mui/icons-material'; // Temporarily removed due to rendering issue
import SimpleEventCard from '../components/SimpleEventCard';
import { useAppSelector } from '../store/hooks';
import { Event } from '../types/event';
import { Participant } from '../types/event';
import { useEvents } from '../hooks/useEvents';

interface Category {
  CategoryID: number;
  CategoryName: string;
  Description: string;
  Color: string;
}

const Events: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [categories, setCategories] = useState<Category[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const { events, loading, error, refetch } = useEvents();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/events/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  // City regions mapping - areas that belong to major cities
  const cityRegions: {[key: string]: string[]} = {
    'london': [
      'camden', 'westminster', 'peckham', 'greenwich', 'tower hamlets', 'hackney', 
      'islington', 'southwark', 'lambeth', 'wandsworth', 'hammersmith', 'kensington',
      'chelsea', 'fulham', 'brixton', 'clapham', 'shoreditch', 'bethnal green',
      'bermondsey', 'canary wharf', 'stratford', 'wembley', 'croydon', 'richmond'
    ],
    'manchester': [
      'cheetham hill', 'moss side', 'chorlton', 'didsbury', 'fallowfield', 'withington',
      'levenshulme', 'rusholme', 'hulme', 'longsight', 'gorton', 'wythenshawe',
      'oldham', 'stockport', 'salford', 'bury', 'bolton', 'rochdale', 'tameside',
      'droylsden', 'ashton-under-lyne', 'audenshaw', 'denton', 'dukinfield', 'hyde',
      'mossley', 'stalybridge'
    ],
    'birmingham': [
      'aston', 'handsworth', 'sparkhill', 'kings heath', 'moseley', 'selly oak',
      'erdington', 'kings norton', 'hall green', 'yardley', 'perry barr', 'harborne',
      'edgbaston', 'quinton', 'northfield', 'small heath', 'ladywood'
    ]
  };

  // Main city coordinates for distance calculation
  const cityCoords: {[key: string]: {lat: number, lng: number}} = {
    'london': { lat: 51.5074, lng: -0.1278 },
    'manchester': { lat: 53.4808, lng: -2.2426 },
    'birmingham': { lat: 52.4862, lng: -1.8904 }
  };

  // Helper function to check if a location belongs to a city
  const belongsToCity = (eventLocation: string, selectedCity: string): boolean => {
    const eventLower = eventLocation.toLowerCase();
    const cityLower = selectedCity.toLowerCase();
    
    // Direct city name match
    if (eventLower.includes(cityLower)) {
      return true;
    }
    
    // Check if any area/region of the city is mentioned
    const regions = cityRegions[cityLower] || [];
    return regions.some(region => eventLower.includes(region));
  };

  const filteredEvents = events.filter((event: any) => {
    const matchesSearch = event.Title?.toLowerCase().includes(search.toLowerCase()) ||
      event.Description?.toLowerCase().includes(search.toLowerCase()) ||
      event.title?.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || event.CategoryName === category || event.category === category;

    // Date filter
    const now = new Date();
    const eventDate = new Date(event.StartDateTime || event.startDate);
    let matchesDate = true;
    if (dateFilter === 'upcoming') {
      matchesDate = eventDate >= now;
    } else if (dateFilter === 'past') {
      matchesDate = eventDate < now;
    }
    // 'all' shows everything

    let matchesLocation = true;
    
    if (location) {
      if (location === "Near Me" && userLocation) {
        // For "Near Me", check if event is within reasonable distance (e.g., 25 miles)
        const eventLocationStr = (event.Location || event.location || '').toLowerCase();
        let eventCoords = null;
        
        // Try to find coordinates for the event location by checking which city it belongs to
        for (const [city, coords] of Object.entries(cityCoords)) {
          if (belongsToCity(eventLocationStr, city)) {
            eventCoords = coords;
            break;
          }
        }
        
        if (eventCoords) {
          const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            eventCoords.lat, eventCoords.lng
          );
          matchesLocation = distance <= 25; // Within 25 miles
        } else {
          matchesLocation = false; // Unknown location, exclude from "Near Me"
        }
      } else {
        const eventLocation = (event.Location || event.location || '');
        const selectedLocation = location;
        
        // Check if it's a major city selection
        if (['London', 'Manchester', 'Birmingham'].includes(selectedLocation)) {
          matchesLocation = belongsToCity(eventLocation, selectedLocation);
        } else {
          // For specific areas, do partial matching
          const eventLower = eventLocation.toLowerCase();
          const selectedLower = selectedLocation.toLowerCase();
          matchesLocation = eventLower.includes(selectedLower) || 
                           selectedLower.includes(eventLower);
        }
      }
    }

    return matchesSearch && matchesCategory && matchesDate && matchesLocation;
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
              {categories.map((cat) => (
                <MenuItem key={cat.CategoryID} value={cat.CategoryName}>
                  {cat.CategoryName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={location}
              label="Location"
              onChange={(e) => {
                const value = e.target.value as string;
                setLocation(value);
                
                // Handle "Near Me" selection
                if (value === "Near Me") {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setUserLocation({
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        });
                        console.log('📍 User location:', position.coords.latitude, position.coords.longitude);
                      },
                      (error) => {
                        console.error('Error getting location:', error);
                        alert('Could not get your location. Please enable location services.');
                        setLocation(''); // Reset selection
                      }
                    );
                  } else {
                    alert('Geolocation is not supported by this browser.');
                    setLocation(''); // Reset selection
                  }
                }
              }}
            >
              <MenuItem value="">All Locations</MenuItem>
              <MenuItem value="London">London (All Areas)</MenuItem>
              <MenuItem value="Camden">Camden</MenuItem>
              <MenuItem value="Peckham">Peckham</MenuItem>
              <MenuItem value="Westminster">Westminster</MenuItem>
              <MenuItem value="Greenwich">Greenwich</MenuItem>
              <MenuItem value="Manchester">Manchester</MenuItem>
              <MenuItem value="Birmingham">Birmingham</MenuItem>
              <MenuItem value="Near Me">📍 Near Me</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Date</InputLabel>
            <Select
              value={dateFilter}
              label="Date"
              onChange={(e) => setDateFilter(e.target.value as string)}
            >
              <MenuItem value="upcoming">Upcoming Events</MenuItem>
              <MenuItem value="past">Past Events</MenuItem>
              <MenuItem value="all">All Events</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event: any, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={event.EventID || event.id || index}>
                  <SimpleEventCard event={event} onRegistrationChange={refetch} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No events found matching your criteria
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try adjusting your search filters or check back later for new events
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

        </>
      )}
    </Box>
  );
};

export default Events;
