import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Avatar,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axios from 'axios';

interface User {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Department: string;
  Location: string;
}

interface InviteColleaguesDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: number;
  eventTitle: string;
  onInviteSuccess?: () => void;
}

const InviteColleaguesDialog: React.FC<InviteColleaguesDialogProps> = ({
  open,
  onClose,
  eventId,
  eventTitle,
  onInviteSuccess
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setSearching(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5001/api/users/search?query=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setSearchResults(response.data.data);
        }
      } catch (err: any) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleToggleUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.size === 0) {
      setError('Please select at least one colleague to invite');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/events/${eventId}/invite`,
        {
          userIds: Array.from(selectedUsers),
          message: message.trim() || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          handleDialogClose();
          if (onInviteSuccess) onInviteSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error sending invitations:', err);
      setError(err.response?.data?.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers(new Set());
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const selectedUsersList = searchResults.filter(u => selectedUsers.has(u.UserID));

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          <Typography variant="h6">Invite Colleagues</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Invite colleagues to "{eventTitle}"
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Invitations sent successfully! Your colleagues will be notified.
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Search Box */}
            <TextField
              fullWidth
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searching && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <Box sx={{ mb: 3, maxHeight: 250, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {searchResults.length === 0 && !searching && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No users found
                  </Typography>
                )}

                <List dense>
                  {searchResults.map((user) => (
                    <ListItem
                      key={user.UserID}
                      button
                      onClick={() => handleToggleUser(user.UserID)}
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <Checkbox
                        checked={selectedUsers.has(user.UserID)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <Avatar sx={{ mr: 2 }}>
                        {user.FirstName.charAt(0)}{user.LastName.charAt(0)}
                      </Avatar>
                      <ListItemText
                        primary={`${user.FirstName} ${user.LastName}`}
                        secondary={`${user.Email} • ${user.Department} • ${user.Location}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Selected Users */}
            {selectedUsers.size > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected ({selectedUsers.size})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedUsersList.map((user) => (
                    <Box
                      key={user.UserID}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.5,
                        backgroundColor: 'primary.light',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      }}
                    >
                      {user.FirstName} {user.LastName}
                      <Button
                        size="small"
                        sx={{ minWidth: 'auto', p: 0, ml: 0.5 }}
                        onClick={() => handleToggleUser(user.UserID)}
                      >
                        ✕
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Personal Message */}
            <TextField
              fullWidth
              label="Personal message (optional)"
              multiline
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              helperText={`${message.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleDialogClose} disabled={loading}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button
            onClick={handleSendInvitations}
            variant="contained"
            disabled={loading || selectedUsers.size === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {loading ? 'Sending...' : `Send ${selectedUsers.size > 0 ? `(${selectedUsers.size})` : ''}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InviteColleaguesDialog;
