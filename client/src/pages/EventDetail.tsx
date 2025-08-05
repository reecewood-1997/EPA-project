import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { joinEvent, leaveEvent } from '../store/eventSlice';
import { AppDispatch } from '../store';
import { Event } from '../types/event';
import axios from 'axios';

const EventDetail: React.FC = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get<Event>(`http://localhost:5000/api/events/${id}`);
        setEvent(response.data);
      } catch (err) {
        setError('Failed to fetch event details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleJoinEvent = () => {
    if (user && event) {
      dispatch(joinEvent({ eventId: event.id.toString(), userId: user.id.toString() }));
    }
  };

  const handleLeaveEvent = () => {
    if (user && event) {
      dispatch(leaveEvent({ eventId: event.id.toString(), userId: user.id.toString() }));
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!event) {
    return <Typography>Event not found</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {event.title}
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          {event.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip label={`Category: ${event.category}`} />
          <Chip label={`Participants: ${event.participants?.length}/${event.maxParticipants}`} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Details
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Location" secondary={event.location} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Date"
                secondary={`${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="Requirements" secondary={event.requirements || 'None'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Objectives" secondary={event.objectives || 'None'} />
            </ListItem>
            {event.contactEmail && (
              <ListItem>
                <ListItemText primary="Contact Email" secondary={event.contactEmail} />
              </ListItem>
            )}
            {event.contactPhone && (
              <ListItem>
                <ListItemText primary="Contact Phone" secondary={event.contactPhone} />
              </ListItem>
            )}
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Participants
          </Typography>
          <List dense>
            {event.participants?.map((participant) => (
              <ListItem key={participant.id}>
                <Avatar>{participant.user.firstName.charAt(0)}</Avatar>
                <ListItemText
                  primary={`${participant.user.firstName} ${participant.user.lastName}`}
                  secondary={participant.status}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {user && (
            <Button
              variant="contained"
              onClick={
                event.participants?.some((p) => p.userId === user.id)
                  ? handleLeaveEvent
                  : handleJoinEvent
              }
              disabled={
                !event.participants?.some((p) => p.userId === user.id) &&
                event.participants && 
                event.participants.length >= event.maxParticipants
              }
            >
              {event.participants?.some((p) => p.userId === user.id) ? 'Leave Event' : 'Join Event'}
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EventDetail;
