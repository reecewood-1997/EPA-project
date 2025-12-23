import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  Rating,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { joinEvent, leaveEvent } from '../store/eventSlice';
import { AppDispatch } from '../store';
import { Event, Participant } from '../types/event';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user) as { id: number } | null;

  
  const eventAny = event as any; 
  const eventData = {
    id: eventAny.EventID || eventAny.id,
    title: eventAny.Title || eventAny.title,
    description: eventAny.Description || eventAny.description,
    startDate: eventAny.StartDateTime || eventAny.startDate,
    endDate: eventAny.EndDateTime || eventAny.endDate,
    location: eventAny.Location || eventAny.location,
    maxParticipants: eventAny.MaxParticipants || eventAny.maxParticipants,
    currentParticipants: eventAny.CurrentParticipants || eventAny.participants?.length || 0,
    category: eventAny.CategoryName || eventAny.category,
    categoryColor: eventAny.CategoryColor,
    participants: eventAny.participants || []
  };

  const handleJoinEvent = () => {
    if (user && eventData) {
      dispatch(joinEvent({ eventId: String(eventData.id), userId: String(user.id) }));
    }
  };

  const handleLeaveEvent = () => {
    if (user && eventData) {
      dispatch(leaveEvent({ eventId: String(eventData.id), userId: String(user.id) }));
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              mr: 2, 
              bgcolor: eventData.categoryColor || 'primary.main' 
            }}
          >
            {eventData.title?.charAt(0) || 'E'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {eventData.title || 'Untitled Event'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📍 {eventData.location || 'Location TBD'}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {eventData.description || 'No description available'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box>
            <Chip 
              label={`${eventData.currentParticipants || 0}/${eventData.maxParticipants || 0} participants`} 
              size="small" 
              color={(eventData.currentParticipants || 0) >= (eventData.maxParticipants || 0) ? 'error' : 'default'}
            />
            <Chip 
              label={eventData.category || 'General'} 
              size="small" 
              sx={{ 
                ml: 1,
                bgcolor: eventData.categoryColor || 'grey.100',
                color: 'white'
              }} 
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {eventData.startDate ? new Date(eventData.startDate).toLocaleDateString() : 'Date TBD'}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          component={RouterLink}
          to={`/events/${String(eventData.id)}`}
          variant="outlined"
          size="small"
        >
          View Details
        </Button>
        {user && (
          <Button
            variant="contained"
            size="small"
            onClick={
              eventData.participants?.some((p: Participant) => p.userId === user.id)
                ? handleLeaveEvent
                : handleJoinEvent
            }
            disabled={eventData.currentParticipants >= eventData.maxParticipants}
          >
            {eventData.participants?.some((p: Participant) => p.userId === user.id) ? 'Leave Event' : 'Join Event'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default EventCard;
