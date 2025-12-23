import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

interface Invitation {
  InvitationID: number;
  InviterFirstName: string;
  InviterLastName: string;
  Message: string | null;
  Status: string;
}

interface InvitationCardProps {
  invitation: Invitation;
  onRespond: () => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({ invitation, onRespond }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRespond = async (status: 'Accepted' | 'Declined') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5001/api/invitations/${invitation.InvitationID}/respond`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onRespond();
      }
    } catch (err: any) {
      console.error('Error responding to invitation:', err);
      setError(err.response?.data?.message || 'Failed to respond to invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'primary.main', backgroundColor: 'info.light' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📨 Event Invitation
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>{invitation.InviterFirstName} {invitation.InviterLastName}</strong> has invited you to this event
        </Typography>

        {invitation.Message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              "{invitation.Message}"
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            onClick={() => handleRespond('Accepted')}
            disabled={loading}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={loading ? <CircularProgress size={20} /> : <CancelIcon />}
            onClick={() => handleRespond('Declined')}
            disabled={loading}
          >
            Decline
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InvitationCard;
