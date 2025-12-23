import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SimpleEventCardProps {
  event: any;
  onRegistrationChange?: () => void;
}

const SimpleEventCard: React.FC<SimpleEventCardProps> = ({ event, onRegistrationChange }) => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [localIsRegistered, setLocalIsRegistered] = useState(event?.IsUserRegistered || false);
  
  const eventId = event?.EventID || event?.id;
  const title = event?.Title || event?.title || 'Untitled Event';
  const description = event?.Description || event?.description || 'No description';
  const location = event?.Location || event?.location || 'Location TBD';
  const category = event?.CategoryName || event?.category || 'General';
  const participants = event?.CurrentParticipants || 0;
  const maxParticipants = event?.MaxParticipants || event?.maxParticipants || 0;
  const createdBy = event?.CreatedBy || event?.createdBy;

  
  const isRegistered = localIsRegistered;

  
  const isEventCreator = event?.IsCreatedByCurrentUser || false;

 
  const eventStartDate = new Date(event?.StartDateTime || event?.startDate);
  const isPastEvent = eventStartDate < new Date();

  useEffect(() => {
    setLocalIsRegistered(event?.IsUserRegistered || false);
  }, [event?.IsUserRegistered]);

  const handleJoinEvent = async () => {
    if (!user || !eventId) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      const response = await axios.post(`http://localhost:5001/api/events/${eventId}/register`, {}, {
        headers
      });

      if (response.data.success) {
        alert('Successfully registered for event!');
        setLocalIsRegistered(true);
        onRegistrationChange?.();
      }
    } catch (error: any) {
      console.error('Error joining event:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to join event. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!user || !eventId) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      const response = await axios.delete(`http://localhost:5001/api/events/${eventId}/unregister`, {
        headers
      });

      if (response.data.success) {
        alert('Successfully left event!');
        setLocalIsRegistered(false);
        onRegistrationChange?.();
      }
    } catch (error: any) {
      console.error('Error leaving event:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to leave event. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      sx={{ mb: 2, height: '100%', cursor: 'pointer' }}
      onClick={() => navigate(`/events/${eventId}`)}
    >
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {String(title)}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {String(description)}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          📅 {eventStartDate.toLocaleDateString('en-GB', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          🕒 {eventStartDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          📍 {String(location)}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Chip 
            label={`${participants}/${maxParticipants} participants`} 
            size="small" 
            variant="outlined"
          />
          <Chip 
            label={String(category)} 
            size="small" 
            color="primary"
          />
        </Box>
      </CardContent>
      
      {user && (
        <CardActions onClick={(e) => e.stopPropagation()}>
          {!isPastEvent && (
            <Button
              variant={isRegistered ? "outlined" : "contained"}
              color={isRegistered ? "secondary" : "primary"}
              size="small"
              onClick={isRegistered ? handleLeaveEvent : handleJoinEvent}
              disabled={isLoading || (!isRegistered && participants >= maxParticipants)}
            >
              {isLoading ? 'Loading...' : (isRegistered ? 'Leave Event' : 'Join Event')}
            </Button>
          )}
          {isPastEvent && (
            <Chip label="Event Completed" color="default" size="small" />
          )}
          {isEventCreator && (
            <Button
              variant="text"
              size="small"
              onClick={() => {
                navigate(`/edit-event/${eventId}`);
              }}
            >
              Edit Event
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default SimpleEventCard;