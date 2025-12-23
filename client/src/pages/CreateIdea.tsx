import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Category {
  CategoryID: number;
  CategoryName: string;
  Description: string;
  Color: string;
}

interface IdeaData {
  title: string;
  description: string;
  location: string;
  expectedImpact: string;
  requiredResources: string;
  estimatedCost: string;
  estimatedParticipants: string;
  categoryID: string;
}

const CreateIdea: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ideaData, setIdeaData] = useState<IdeaData>({
    title: '',
    description: '',
    location: '',
    expectedImpact: '',
    requiredResources: '',
    estimatedCost: '',
    estimatedParticipants: '',
    categoryID: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/events/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (field: keyof IdeaData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIdeaData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ideaData.title || !ideaData.description || !ideaData.categoryID) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ideaToCreate = {
        title: ideaData.title,
        description: ideaData.description,
        location: ideaData.location || null,
        expectedImpact: ideaData.expectedImpact || null,
        requiredResources: ideaData.requiredResources || null,
        estimatedCost: ideaData.estimatedCost ? parseFloat(ideaData.estimatedCost) : null,
        estimatedParticipants: ideaData.estimatedParticipants ? parseInt(ideaData.estimatedParticipants) : null,
        categoryID: parseInt(ideaData.categoryID),
      };

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await axios.post('http://localhost:5001/api/ideas', ideaToCreate, {
        headers
      });

      if (response.data.success) {
        alert('Idea submitted successfully!');
        navigate('/ideas');
      }
    } catch (backendError: any) {
      console.error('Backend error:', backendError);
      
      if (backendError.response) {
        setError(`Error submitting idea: ${backendError.response.data.message || 'Unknown error'}`);
      } else if (backendError.request) {
        setError('Cannot connect to server. Please ensure the server is running.');
      } else {
        setError('Failed to submit idea. Please try again.');
      }
    } finally {
      setSubmitting(false);
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

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          💡 Submit Your Idea
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Share your idea for a PwC One Firm One Day volunteer initiative
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Idea Title *"
                value={ideaData.title}
                onChange={handleChange('title')}
                required
                helperText="A clear, compelling title for your volunteer idea"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={4}
                value={ideaData.description}
                onChange={handleChange('description')}
                required
                helperText="Describe your volunteer idea in detail"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={ideaData.location}
                onChange={handleChange('location')}
                helperText="Where would this volunteer activity take place?"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={ideaData.categoryID}
                  label="Category *"
                  onChange={(e) => setIdeaData(prev => ({...prev, categoryID: e.target.value}))}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.CategoryID} value={cat.CategoryID}>
                      {cat.CategoryName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Impact & Resources */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Impact & Resources
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expected Impact"
                multiline
                rows={3}
                value={ideaData.expectedImpact}
                onChange={handleChange('expectedImpact')}
                helperText="What positive impact will this initiative have on the community?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Required Resources"
                multiline
                rows={3}
                value={ideaData.requiredResources}
                onChange={handleChange('requiredResources')}
                helperText="What resources, skills, or materials are needed to implement this idea?"
              />
            </Grid>

            {/* Logistics */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Logistics
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Cost (£)"
                type="number"
                value={ideaData.estimatedCost}
                onChange={handleChange('estimatedCost')}
                helperText="Estimated budget needed in GBP"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Participants"
                type="number"
                value={ideaData.estimatedParticipants}
                onChange={handleChange('estimatedParticipants')}
                helperText="How many volunteers do you expect?"
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/ideas')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Idea'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateIdea;