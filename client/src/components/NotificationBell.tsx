import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemText,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Notification {
  NotificationID: number;
  Type: string;
  Title: string;
  Message: string;
  RelatedEntityType: string | null;
  RelatedEntityID: number | null;
  ActionURL: string | null;
  IsRead: boolean;
  CreatedAt: string;
}

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5001/api/notifications/unread/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5001/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    await fetchNotifications();

    if (unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          'http://localhost:5001/api/notifications/read-all',
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setUnreadCount(0); // Clear badge immediately
        await fetchNotifications(); // Refresh to show updated read status
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.ActionURL) {
      navigate(notification.ActionURL);
    } else if (notification.RelatedEntityType === 'event' && notification.RelatedEntityID) {
      navigate(`/events/${notification.RelatedEntityID}`);
    } else if (notification.RelatedEntityType === 'idea' && notification.RelatedEntityID) {
      navigate(`/ideas/${notification.RelatedEntityID}`);
    }

    handleClose();
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 2 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.NotificationID}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.IsRead ? 'transparent' : 'action.hover',
                whiteSpace: 'normal',
                py: 1.5,
                borderLeft: notification.IsRead ? 'none' : '4px solid',
                borderColor: 'primary.main',
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle2" fontWeight={notification.IsRead ? 'normal' : 'bold'}>
                    {notification.Title}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.Message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {getTimeSince(notification.CreatedAt)}
                    </Typography>
                  </>
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
