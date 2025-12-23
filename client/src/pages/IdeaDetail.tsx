import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
} from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Idea {
  IdeaID: number;
  Title: string;
  Description: string;
  Location: string;
  ExpectedImpact: string;
  RequiredResources: string;
  EstimatedCost: number;
  EstimatedParticipants: number;
  Status: string;
  CategoryName: string;
  CategoryColor: string;
  SubmittedBy: string;
  UpvoteCount: number;
  DownvoteCount: number;
  NetVotes: number;
  UserVote: string | null;
  IsCreatedByCurrentUser: boolean;
  CreatedAt: string;
}

interface Comment {
  CommentID: number;
  Comment: string;
  UserName: string;
  UserRole: string;
  UserID: number;
  IsAdminComment: boolean;
  CreatedAt: string;
}

const IdeaDetail: React.FC = () => {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);

  const fetchIdeaDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      // Fetch idea from ideas list endpoint to get voting info
      const ideasResponse = await axios.get('http://localhost:5001/api/ideas', { headers });
      if (ideasResponse.data.success) {
        const ideas = Array.isArray(ideasResponse.data.data) ? ideasResponse.data.data : [];
        const foundIdea = ideas.find((i: any) => i.IdeaID === parseInt(ideaId || '0'));
        if (foundIdea) {
          // SQL Server already returns the correct format
          setIdea(foundIdea);
        } else {
          setError('Idea not found');
        }
      }
    } catch (err: any) {
      console.error('Error fetching idea:', err);
      setError('Failed to fetch idea details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      const response = await axios.get(`http://localhost:5001/api/ideas/${ideaId}/comments`, { headers });
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    }
  };

  useEffect(() => {
    if (ideaId) {
      fetchIdeaDetails();
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user || !idea) {
      alert('Please login to vote on ideas');
      return;
    }

    setVotingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // If user already voted the same way, remove the vote
      if (idea.UserVote === voteType) {
        await axios.delete(`http://localhost:5001/api/ideas/${ideaId}/vote`, { headers });
      } else {
        await axios.post(`http://localhost:5001/api/ideas/${ideaId}/vote`,
          { voteType },
          { headers }
        );
      }

      // Refresh idea to get updated vote counts
      await fetchIdeaDetails();
    } catch (error: any) {
      console.error('Error voting:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to record vote. Please try again.');
      }
    } finally {
      setVotingLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `http://localhost:5001/api/ideas/${ideaId}/comments`,
        { comment: newComment },
        { headers }
      );

      if (response.data.success) {
        setNewComment('');
        await fetchComments();
      }
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to submit comment. Please try again.');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.delete(
        `http://localhost:5001/api/ideas/comments/${commentId}`,
        { headers }
      );

      if (response.data.success) {
        await fetchComments();
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to delete comment. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'default';
      case 'under_review': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'implemented': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !idea) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Idea not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/ideas')}
          sx={{ mt: 2 }}
        >
          Back to Ideas
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/ideas')}
          sx={{ mb: 3 }}
        >
          Back to Ideas
        </Button>

        <Paper sx={{ p: 4 }}>
          {/* Idea Header */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Chip
              label={String(idea.CategoryName || 'General')}
              sx={{ backgroundColor: idea.CategoryColor || '#1976d2', color: 'white' }}
            />
            <Chip
              label={String(idea.Status || 'submitted').replace('_', ' ')}
              color={getStatusColor(idea.Status) as any}
              variant="outlined"
            />
          </Box>

          <Typography variant="h4" component="h1" gutterBottom>
            {idea.Title}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Submitted by {idea.SubmittedBy} on {new Date(idea.CreatedAt).toLocaleDateString()}
            </Typography>

            {user && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant={idea.UserVote === 'upvote' ? 'contained' : 'outlined'}
                  onClick={() => handleVote('upvote')}
                  disabled={votingLoading}
                  color="primary"
                >
                  👍 {idea.UpvoteCount || 0}
                </Button>
                <Button
                  size="small"
                  variant={idea.UserVote === 'downvote' ? 'contained' : 'outlined'}
                  onClick={() => handleVote('downvote')}
                  disabled={votingLoading}
                  color="error"
                >
                  👎 {idea.DownvoteCount || 0}
                </Button>
                <Chip label={`Net: ${idea.NetVotes || 0}`} color="primary" />
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Idea Details */}
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" paragraph>
            {idea.Description}
          </Typography>

          {idea.Location && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Location
              </Typography>
              <Typography variant="body1" paragraph>
                {idea.Location}
              </Typography>
            </>
          )}

          {idea.ExpectedImpact && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Expected Impact
              </Typography>
              <Typography variant="body1" paragraph>
                {idea.ExpectedImpact}
              </Typography>
            </>
          )}

          {idea.RequiredResources && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Required Resources
              </Typography>
              <Typography variant="body1" paragraph>
                {idea.RequiredResources}
              </Typography>
            </>
          )}

          {idea.EstimatedCost > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Estimated Cost
              </Typography>
              <Typography variant="body1" paragraph>
                £{idea.EstimatedCost.toFixed(2)}
              </Typography>
            </>
          )}

          {idea.EstimatedParticipants > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Estimated Participants
              </Typography>
              <Typography variant="body1" paragraph>
                {idea.EstimatedParticipants} volunteers
              </Typography>
            </>
          )}

          <Divider sx={{ my: 4 }} />

          {/* Comments Section */}
          <Typography variant="h5" gutterBottom>
            Comments ({comments.length})
          </Typography>

          {user && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submittingComment}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmitComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </Box>
            </Box>
          )}

          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            <List>
              {comments.map((comment) => (
                <ListItem
                  key={comment.CommentID}
                  alignItems="flex-start"
                  secondaryAction={
                    user && (user.id === comment.UserID || user.role === 'admin') && (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteComment(comment.CommentID)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )
                  }
                  sx={{
                    backgroundColor: comment.IsAdminComment ? '#fff3e0' : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: comment.IsAdminComment ? '#ff9800' : '#1976d2' }}>
                      {comment.UserName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography component="span" variant="subtitle2" fontWeight="bold">
                          {comment.UserName}
                        </Typography>
                        {comment.IsAdminComment && (
                          <Chip label="Admin" size="small" color="warning" />
                        )}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {new Date(comment.CreatedAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {comment.Comment}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default IdeaDetail;
