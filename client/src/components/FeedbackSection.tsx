import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  Divider,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';

interface FeedbackSectionProps {
  eventId: number;
  isRegistered: boolean;
}

interface Feedback {
  FeedbackID: number;
  Rating: number;
  Comment: string;
  WouldRecommend: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  FirstName: string;
  LastName: string;
}

interface FeedbackStats {
  TotalFeedback: number;
  AverageRating: number;
  FiveStars: number;
  FourStars: number;
  ThreeStars: number;
  TwoStars: number;
  OneStar: number;
  WouldRecommend: number;
  WouldNotRecommend: number;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ eventId, isRegistered }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [myFeedback, setMyFeedback] = useState<any>(null);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchMyFeedback();
    fetchAllFeedback();
    fetchStats();
  }, [eventId]);

  const fetchMyFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`http://localhost:5001/api/events/${eventId}/feedback/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success && response.data.data) {
        const feedback = response.data.data;
        setMyFeedback(feedback);
        setRating(feedback.Rating);
        setComment(feedback.Comment || '');
        setWouldRecommend(feedback.WouldRecommend);
      }
    } catch (error) {
      console.error('Error fetching my feedback:', error);
    }
  };

  const fetchAllFeedback = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/events/${eventId}/feedback`);
      if (response.data.success) {
        setAllFeedback(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/events/${eventId}/feedback/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/events/${eventId}/feedback`,
        { rating, comment, wouldRecommend },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        fetchMyFeedback();
        fetchAllFeedback();
        fetchStats();
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit feedback'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your feedback?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/events/${eventId}/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Feedback deleted successfully' });
      setMyFeedback(null);
      setRating(0);
      setComment('');
      setWouldRecommend(true);
      fetchAllFeedback();
      fetchStats();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete feedback' });
    }
  };

  const getRatingPercentage = (count: number) => {
    if (!stats || stats.TotalFeedback === 0) return 0;
    return (count / stats.TotalFeedback) * 100;
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Event Feedback
      </Typography>

      {/* Statistics Section */}
      {stats && stats.TotalFeedback > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="div">
                  {stats.AverageRating?.toFixed(1) || '0.0'}
                </Typography>
                <Rating value={stats.AverageRating} readOnly precision={0.1} />
                <Typography variant="body2" color="text.secondary">
                  Based on {stats.TotalFeedback} {stats.TotalFeedback === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              {[5, 4, 3, 2, 1].map((stars) => (
                <Box key={stars} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ width: 30 }}>
                    {stars}
                  </Typography>
                  <StarIcon sx={{ fontSize: 16, color: 'gold', mr: 1 }} />
                  <LinearProgress
                    variant="determinate"
                    value={getRatingPercentage(
                      stars === 5 ? stats.FiveStars :
                      stars === 4 ? stats.FourStars :
                      stars === 3 ? stats.ThreeStars :
                      stars === 2 ? stats.TwoStars :
                      stats.OneStar
                    )}
                    sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ width: 40 }}>
                    {stars === 5 ? stats.FiveStars :
                     stars === 4 ? stats.FourStars :
                     stars === 3 ? stats.ThreeStars :
                     stars === 2 ? stats.TwoStars :
                     stats.OneStar}
                  </Typography>
                </Box>
              ))}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip
                  icon={<ThumbUpIcon />}
                  label={`${stats.WouldRecommend} would recommend`}
                  color="success"
                  variant="outlined"
                />
                {stats.WouldNotRecommend > 0 && (
                  <Chip
                    icon={<ThumbDownIcon />}
                    label={`${stats.WouldNotRecommend} would not recommend`}
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Submit Feedback Form */}
      {isRegistered && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {myFeedback ? 'Update Your Feedback' : 'Leave Feedback'}
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Rating *</Typography>
            <Rating
              value={rating}
              onChange={(_, value) => setRating(value || 0)}
              size="large"
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
              />
            }
            label="I would recommend this event"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {myFeedback ? 'Update Feedback' : 'Submit Feedback'}
            </Button>

            {myFeedback && (
              <Button variant="outlined" color="error" onClick={handleDelete}>
                Delete Feedback
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* All Feedback */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        All Reviews ({allFeedback.length})
      </Typography>

      {allFeedback.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No feedback yet. Be the first to leave a review!
          </Typography>
        </Paper>
      ) : (
        allFeedback.map((feedback) => (
          <Card key={feedback.FeedbackID} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {feedback.FirstName} {feedback.LastName}
                  </Typography>
                  <Rating value={feedback.Rating} readOnly size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(feedback.CreatedAt).toLocaleDateString()}
                </Typography>
              </Box>

              {feedback.Comment && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {feedback.Comment}
                </Typography>
              )}

              {feedback.WouldRecommend && (
                <Chip
                  icon={<ThumbUpIcon />}
                  label="Would recommend"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default FeedbackSection;
