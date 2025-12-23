import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface DashboardStats {
  totalEvents: number;
  totalIdeas: number;
  totalUsers: number;
  totalRegistrations: number;
  pendingIdeas: number;
}

interface PendingIdea {
  IdeaID: number;
  Title: string;
  Description: string;
  Location: string;
  CategoryName: string;
  CategoryColor: string;
  SubmittedBy: string;
  CreatedAt: string;
  Status: string;
  UpvoteCount: number;
  DownvoteCount: number;
  NetVotes: number;
}

interface ApprovedIdea extends PendingIdea {
  ExpectedImpact: string;
  RequiredResources: string;
  EstimatedCost: number;
  EstimatedParticipants: number;
  CategoryID: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingIdeas, setPendingIdeas] = useState<PendingIdea[]>([]);
  const [approvedIdeas, setApprovedIdeas] = useState<ApprovedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsResponse, pendingResponse, approvedResponse] = await Promise.all([
        axios.get('http://localhost:5001/api/admin/stats', { headers }),
        axios.get('http://localhost:5001/api/admin/pending-ideas', { headers }),
        axios.get('http://localhost:5001/api/admin/approved-ideas', { headers })
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (pendingResponse.data.success) {
        setPendingIdeas(pendingResponse.data.data);
      }

      if (approvedResponse.data.success) {
        setApprovedIdeas(approvedResponse.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ideaId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.put(`http://localhost:5001/api/admin/ideas/${ideaId}/status`,
        { status: 'approved' },
        { headers }
      );

      alert('Idea approved successfully!');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error approving idea:', error);
      alert('Failed to approve idea');
    }
  };

  const handleReject = async (ideaId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.put(`http://localhost:5001/api/admin/ideas/${ideaId}/status`,
        { status: 'rejected' },
        { headers }
      );

      alert('Idea rejected');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error rejecting idea:', error);
      alert('Failed to reject idea');
    }
  };

  const handleConvertToEvent = (idea: ApprovedIdea) => {
    navigate('/events/create', {
      state: {
        fromIdea: true,
        ideaId: idea.IdeaID,
        title: idea.Title,
        description: idea.Description,
        location: idea.Location,
        categoryId: idea.CategoryID,
        maxParticipants: idea.EstimatedParticipants,
        requiredSkills: idea.RequiredResources
      }
    });
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Manage volunteer events and community ideas
        </Typography>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Events
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalEvents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Ideas
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalIdeas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Ideas
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingIdeas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Pending Ideas for Review */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Pending Ideas for Review
          </Typography>

          {pendingIdeas.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No pending ideas to review
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Votes</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingIdeas.map((idea) => (
                    <TableRow key={idea.IdeaID}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {String(idea.Title)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {String(idea.Description).substring(0, 100)}
                          {idea.Description.length > 100 ? '...' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={String(idea.CategoryName)}
                          size="small"
                          sx={{ backgroundColor: idea.CategoryColor, color: 'white' }}
                        />
                      </TableCell>
                      <TableCell>{String(idea.Location || 'N/A')}</TableCell>
                      <TableCell>{String(idea.SubmittedBy)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label={`👍 ${idea.UpvoteCount}`} size="small" />
                          <Chip label={`Net: ${idea.NetVotes}`} size="small" color="primary" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(idea.CreatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleApprove(idea.IdeaID)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleReject(idea.IdeaID)}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Approved Ideas Ready for Conversion */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Approved Ideas - Convert to Events
          </Typography>

          {approvedIdeas.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No approved ideas ready for conversion
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Votes</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedIdeas.map((idea) => (
                    <TableRow key={idea.IdeaID}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {String(idea.Title)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {String(idea.Description).substring(0, 100)}
                          {idea.Description.length > 100 ? '...' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={String(idea.CategoryName)}
                          size="small"
                          sx={{ backgroundColor: idea.CategoryColor, color: 'white' }}
                        />
                      </TableCell>
                      <TableCell>{String(idea.Location || 'N/A')}</TableCell>
                      <TableCell>{String(idea.SubmittedBy)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label={`👍 ${idea.UpvoteCount}`} size="small" />
                          <Chip label={`Net: ${idea.NetVotes}`} size="small" color="primary" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(idea.CreatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleConvertToEvent(idea)}
                        >
                          Convert to Event
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
