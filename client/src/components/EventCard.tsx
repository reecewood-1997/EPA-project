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

  const handleJoinEvent = () => {
    if (user && event) {
      dispatch(joinEvent({ eventId: String(event.id), userId: String(user.id) }));
    }
  };

  const handleLeaveEvent = () => {
    if (user && event) {
      dispatch(leaveEvent({ eventId: String(event.id), userId: String(user.id) }));
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2 }}>
            {event.title.charAt(0)}
          </Avatar>
          <Typography variant="h6" component="div">
            {event.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {event.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box>
            <Chip label={`${event.participants?.length || 0}/${event.maxParticipants} participants`} size="small" />
            <Chip label={event.category} size="small" sx={{ ml: 1 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          component={RouterLink}
          to={`/events/${String(event.id)}`}
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
              event.participants?.some((p: Participant) => p.userId === user.id)
                ? handleLeaveEvent
                : handleJoinEvent
            }
            disabled={event.participants && event.participants.length >= event.maxParticipants}
          >
            {event.participants?.some((p: Participant) => p.userId === user.id) ? 'Leave Event' : 'Join Event'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default EventCard;
