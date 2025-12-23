import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

const Ideas: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingLoading, setVotingLoading] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      const response = await axios.get('http://localhost:5001/api/ideas', { headers });
      if (response.data.success) {
        // SQL Server already returns the correct format with uppercase properties
        const ideas = Array.isArray(response.data.data) ? response.data.data : [];
        setIdeas(ideas);
      }
    } catch (err: any) {
      console.error('Error fetching ideas:', err);
      setError('Failed to fetch ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleVote = async (ideaId: number, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      alert('Please login to vote on ideas');
      return;
    }

    setVotingLoading(ideaId);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // If user already voted the same way, remove the vote
      const idea = ideas.find(i => i.IdeaID === ideaId);
      if (idea?.UserVote === voteType) {
        await axios.delete(`http://localhost:5001/api/ideas/${ideaId}/vote`, { headers });
      } else {
        await axios.post(`http://localhost:5001/api/ideas/${ideaId}/vote`,
          { voteType },
          { headers }
        );
      }

      // Refresh ideas to get updated vote counts
      await fetchIdeas();
    } catch (error: any) {
      console.error('Error voting:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to record vote. Please try again.');
      }
    } finally {
      setVotingLoading(null);
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

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Get unique categories
  const uniqueCategories = Array.from(new Set(ideas.map(idea => idea.CategoryName).filter(Boolean)));

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = searchText === '' ||
      idea.Title.toLowerCase().includes(searchText.toLowerCase()) ||
      idea.Description.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = categoryFilter === '' || idea.CategoryName === categoryFilter;

    const matchesStatus = statusFilter === 'all' || idea.Status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Community Ideas
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Share your ideas for PwC One Firm One Day volunteer initiatives
            </Typography>
          </Box>
          {user && (
            <Button
              variant="contained"
              onClick={() => navigate('/ideas/create')}
              size="large"
            >
              Submit Idea
            </Button>
          )}
        </Box>

        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 250 }}
            placeholder="Search ideas..."
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value as string)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {uniqueCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as string)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="implemented">Implemented</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {filteredIdeas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No ideas yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Be the first to submit a volunteer idea for PwC One Firm One Day!
            </Typography>
            {user && (
              <Button
                variant="outlined"
                onClick={() => navigate('/ideas/create')}
              >
                Submit First Idea
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredIdeas.map((idea) => (
              <Grid item xs={12} md={6} lg={4} key={idea.IdeaID}>
                <Card
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                  onClick={() => navigate(`/ideas/${idea.IdeaID}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={String(idea.CategoryName || 'General')}
                        size="small"
                        sx={{ backgroundColor: idea.CategoryColor || '#1976d2', color: 'white' }}
                      />
                      <Chip
                        label={String(idea.Status || 'submitted').replace('_', ' ')}
                        size="small"
                        color={getStatusColor(idea.Status) as any}
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="h6" component="h3" gutterBottom>
                      {String(idea.Title || 'Untitled')}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {idea.Description && idea.Description.length > 150
                        ? `${String(idea.Description).substring(0, 150)}...`
                        : String(idea.Description || 'No description')
                      }
                    </Typography>

                    {idea.Location && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        📍 {String(idea.Location)}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        By {String(idea.SubmittedBy || 'Unknown')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {idea.CreatedAt ? new Date(idea.CreatedAt).toLocaleDateString() : ''}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }} onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {user && (
                        <>
                          <Button
                            size="small"
                            onClick={() => handleVote(idea.IdeaID, 'upvote')}
                            disabled={votingLoading === idea.IdeaID}
                            color={idea.UserVote === 'upvote' ? 'primary' : 'inherit'}
                          >
                            👍 {idea.UpvoteCount || 0}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleVote(idea.IdeaID, 'downvote')}
                            disabled={votingLoading === idea.IdeaID}
                            color={idea.UserVote === 'downvote' ? 'error' : 'inherit'}
                          >
                            👎 {idea.DownvoteCount || 0}
                          </Button>
                        </>
                      )}
                    </Box>

                    <Typography variant="body2" color="primary">
                      Net: {idea.NetVotes || 0}
                    </Typography>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Ideas;
