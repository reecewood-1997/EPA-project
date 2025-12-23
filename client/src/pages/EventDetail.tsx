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
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import axios from 'axios';
import FeedbackSection from '../components/FeedbackSection';
import InviteColleaguesDialog from '../components/InviteColleaguesDialog';
import InvitationCard from '../components/InvitationCard';

const EventDetail: React.FC = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<any>(null);
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const fetchEvent = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      // Fetch event details
      const eventResponse = await axios.get(`http://localhost:5001/api/events/${id}`, { headers });
      if (eventResponse.data.success) {
        setEvent(eventResponse.data.data);
      }

      // Fetch participants separately
      try {
        const participantsResponse = await axios.get(`http://localhost:5001/api/events/${id}/participants`, { headers });
        if (participantsResponse.data.success) {
          setParticipants(participantsResponse.data.data || []);
        }
      } catch (partErr) {
        console.error('Error fetching participants:', partErr);
        setParticipants([]);
      }

      // Fetch pending invitation for this event if user is logged in
      if (user && token) {
        try {
          const invitationsResponse = await axios.get('http://localhost:5001/api/invitations/received', { headers });
          if (invitationsResponse.data.success) {
            const eventInvitation = invitationsResponse.data.data.find(
              (inv: any) => inv.EventID === parseInt(id) && inv.Status === 'Pending'
            );
            setPendingInvitation(eventInvitation || null);
          }
        } catch (invErr) {
          console.error('Error fetching invitations:', invErr);
          // Don't set error state here, as this is optional
        }
      }
    } catch (err: any) {
      console.error('Error fetching event:', err);
      setError('Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleJoinEvent = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      const response = await axios.post(`http://localhost:5001/api/events/${id}/register`, {}, {
        headers
      });

      if (response.data.success) {
        await fetchEvent(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error joining event:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to join event. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      const response = await axios.delete(`http://localhost:5001/api/events/${id}/unregister`, {
        headers
      });

      if (response.data.success) {
        await fetchEvent(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error leaving event:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to leave event. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!user || !event) return;

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel "${event.Title}"? This action cannot be undone.`
    );

    if (!confirmCancel) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      const response = await axios.delete(`http://localhost:5001/api/events/${id}`, {
        headers
      });

      if (response.data.success) {
        alert('Event cancelled successfully');
        navigate('/events');
      }
    } catch (error: any) {
      console.error('Error cancelling event:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to cancel event. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Event not found
        </Alert>
      </Container>
    );
  }

  // Check if user is registered - check both uppercase (SQL) and lowercase (in-memory) formats
  const isUserRegistered =
    event.IsUserRegistered ||
    participants.some((p: any) => p.UserID === user?.id || p.userId === user?.id) ||
    false;

  // Parse event skills safely
  let eventSkills: string[] = [];
  try {
    if (event.RequiredSkills) {
      const parsed = typeof event.RequiredSkills === 'string'
        ? JSON.parse(event.RequiredSkills)
        : event.RequiredSkills;
      eventSkills = Array.isArray(parsed) ? parsed : [];
    } else if (event.tags && Array.isArray(event.tags)) {
      eventSkills = event.tags;
    }
  } catch (e) {
    console.error('Failed to parse event skills:', e, event.RequiredSkills);
    eventSkills = [];
  }

  // Check if event has already happened (support both formats)
  const eventStartDate = new Date(event.StartDateTime || event.startDate);
  const eventEndDate = new Date(event.EndDateTime || event.endDate);
  const isPastEvent = eventEndDate < new Date();

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        {/* Invitation Card */}
        {pendingInvitation && (
          <InvitationCard
            invitation={pendingInvitation}
            onRespond={() => {
              setPendingInvitation(null);
              fetchEvent(); // Refresh event data
            }}
          />
        )}

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {event.Title || event.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={event.CategoryName || event.category}
              color="primary"
              sx={{ backgroundColor: event.CategoryColor || undefined }}
            />
            <Chip
              label={`${event.CurrentParticipants || participants.length}/${event.MaxParticipants || event.maxParticipants} participants`}
              variant="outlined"
            />
            {isUserRegistered && (
              <Chip label="You're registered" color="success" variant="outlined" />
            )}
            {isPastEvent && (
              <Chip label="Past Event" color="default" variant="outlined" />
            )}
          </Box>
        </Box>

        {/* Description */}
        <Typography variant="body1" paragraph sx={{ mb: 4 }}>
          {event.Description || event.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Event Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Event Details
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="📍 Location"
                secondary={event.Location || event.location}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="📅 Start Date & Time"
                secondary={new Date(event.StartDateTime || event.startDate).toLocaleString()}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="🏁 End Date & Time"
                secondary={new Date(event.EndDateTime || event.endDate).toLocaleString()}
              />
            </ListItem>
            {eventSkills.length > 0 && (
              <ListItem>
                <ListItemText
                  primary="🏷️ Skills/Tags"
                  secondary={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      {eventSkills.map((skill: string, index: number) => (
                        <Chip key={index} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>
                  }
                />
              </ListItem>
            )}
            <ListItem>
              <ListItemText
                primary="👤 Organizer"
                secondary={event.CreatedByName || `${event.createdBy?.firstName} ${event.createdBy?.lastName}`}
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Participants */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Participants ({participants.length})
          </Typography>
          {participants.length > 0 ? (
            <List dense>
              {participants.map((participant: any, index: number) => (
                <ListItem key={index}>
                  <Avatar sx={{ mr: 2 }}>
                    {(participant.FirstName || participant.user?.firstName)?.charAt(0) || 'U'}
                  </Avatar>
                  <ListItemText
                    primary={`${participant.FirstName || participant.user?.firstName || ''} ${participant.LastName || participant.user?.lastName || ''}`}
                    secondary={participant.Status || participant.status}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No participants yet. Be the first to join!
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {user && !isPastEvent && (
              <Button
                variant={isUserRegistered ? "outlined" : "contained"}
                color={isUserRegistered ? "secondary" : "primary"}
                onClick={isUserRegistered ? handleLeaveEvent : handleJoinEvent}
                disabled={actionLoading || (!isUserRegistered && (event.CurrentParticipants || participants.length) >= (event.MaxParticipants || event.maxParticipants))}
              >
                {actionLoading ? 'Loading...' : (isUserRegistered ? 'Leave Event' : 'Join Event')}
              </Button>
            )}

            {user && !isPastEvent && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={() => setInviteDialogOpen(true)}
              >
                Invite Colleagues
              </Button>
            )}

            {isPastEvent && (
              <Chip label="Event Completed" color="default" sx={{ fontWeight: 'bold' }} />
            )}

            {user && (event.IsCreatedByCurrentUser || event.createdBy?.id === user.id) && (
              <Button
                variant="outlined"
                onClick={() => navigate(`/edit-event/${event.EventID || event.id}`)}
              >
                Edit Event
              </Button>
            )}

            {user && (user.role === 'admin' || event.IsCreatedByCurrentUser || event.createdBy?.id === user.id) && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelEvent}
                disabled={actionLoading}
              >
                Cancel Event
              </Button>
            )}
          </Box>

          <Button
            variant="outlined"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Feedback Section */}
        <FeedbackSection
          eventId={parseInt(id || '0')}
          isRegistered={isUserRegistered}
        />
      </Paper>

      {/* Invite Colleagues Dialog */}
      <InviteColleaguesDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        eventId={parseInt(id || '0')}
        eventTitle={event.Title || event.title}
        onInviteSuccess={() => {
          fetchEvent();
        }}
      />
    </Container>
  );
};

export default EventDetail;
