import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Ideas from './Ideas';
import authReducer from '../store/authSlice';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Ideas Page', () => {
  const mockIdeas = [
    {
      IdeaID: 1,
      Title: 'Community Garden',
      Description: 'Create a community garden in the city center to promote sustainability',
      Location: 'London',
      ExpectedImpact: 'High',
      RequiredResources: 'Seeds, tools, volunteers',
      EstimatedCost: 500,
      EstimatedParticipants: 20,
      Status: 'submitted',
      CategoryName: 'Environment',
      CategoryColor: '#4caf50',
      SubmittedBy: 'John Doe',
      UpvoteCount: 10,
      DownvoteCount: 2,
      NetVotes: 8,
      UserVote: null,
      IsCreatedByCurrentUser: false,
      CreatedAt: '2024-01-15T10:00:00Z'
    },
    {
      IdeaID: 2,
      Title: 'Food Bank Support',
      Description: 'Weekly volunteering at local food bank',
      Location: 'Manchester',
      ExpectedImpact: 'Very High',
      RequiredResources: 'Volunteers',
      EstimatedCost: 100,
      EstimatedParticipants: 15,
      Status: 'approved',
      CategoryName: 'Community',
      CategoryColor: '#2196f3',
      SubmittedBy: 'Jane Smith',
      UpvoteCount: 25,
      DownvoteCount: 1,
      NetVotes: 24,
      UserVote: 'upvote',
      IsCreatedByCurrentUser: false,
      CreatedAt: '2024-01-10T09:00:00Z'
    },
    {
      IdeaID: 3,
      Title: 'Tech Mentorship',
      Description: 'Mentor students in technology',
      Location: 'Birmingham',
      ExpectedImpact: 'Medium',
      RequiredResources: 'Mentors with tech skills',
      EstimatedCost: 0,
      EstimatedParticipants: 10,
      Status: 'rejected',
      CategoryName: 'Education',
      CategoryColor: '#ff9800',
      SubmittedBy: 'Current User',
      UpvoteCount: 5,
      DownvoteCount: 8,
      NetVotes: -3,
      UserVote: 'downvote',
      IsCreatedByCurrentUser: true,
      CreatedAt: '2024-01-05T14:00:00Z'
    }
  ];

  const createMockStore = (isAuthenticated = true) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: isAuthenticated ? {
          user: { id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' },
          token: 'test-token',
          isAuthenticated: true,
        } : {
          user: null,
          token: null,
          isAuthenticated: false,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: mockIdeas }
    });
  });

  it('should render page title and description', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Community Ideas')).toBeInTheDocument();
    expect(screen.getByText(/Share your ideas for PwC One Firm One Day/i)).toBeInTheDocument();
  });

  it('should display submit idea button when user is logged in', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Submit Idea')).toBeInTheDocument();
  });

  it('should not display submit idea button when user is not logged in', () => {
    const store = createMockStore(false);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByText('Submit Idea')).not.toBeInTheDocument();
  });

  it('should fetch and display all ideas on mount', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:5001/api/ideas',
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
      expect(screen.getByText('Food Bank Support')).toBeInTheDocument();
      expect(screen.getByText('Tech Mentorship')).toBeInTheDocument();
    });
  });

  it('should display loading spinner while fetching', () => {
    const store = createMockStore();
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    const store = createMockStore();
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch ideas')).toBeInTheDocument();
    });
  });

  it('should filter ideas by search text', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search ideas/i);
    fireEvent.change(searchInput, { target: { value: 'Garden' } });

    expect(screen.getByText('Community Garden')).toBeInTheDocument();
    expect(screen.queryByText('Food Bank Support')).not.toBeInTheDocument();
    expect(screen.queryByText('Tech Mentorship')).not.toBeInTheDocument();
  });

  it('should filter ideas by category', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const categoryFilter = screen.getByLabelText(/Category/i);
    fireEvent.change(categoryFilter, { target: { value: 'Environment' } });

    expect(screen.getByText('Community Garden')).toBeInTheDocument();
    expect(screen.queryByText('Food Bank Support')).not.toBeInTheDocument();
  });

  it('should filter ideas by status', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/Status/i);
    fireEvent.change(statusFilter, { target: { value: 'approved' } });

    expect(screen.queryByText('Community Garden')).not.toBeInTheDocument();
    expect(screen.getByText('Food Bank Support')).toBeInTheDocument();
  });

  it('should upvote an idea when upvote button is clicked', async () => {
    const store = createMockStore();
    mockedAxios.post.mockResolvedValue({
      data: { success: true, message: 'Vote recorded' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const upvoteButtons = screen.getAllByText(/👍/);
    fireEvent.click(upvoteButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/ideas/1/vote',
        { voteType: 'upvote' },
        expect.any(Object)
      );
    });
  });

  it('should downvote an idea when downvote button is clicked', async () => {
    const store = createMockStore();
    mockedAxios.post.mockResolvedValue({
      data: { success: true, message: 'Vote recorded' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const downvoteButtons = screen.getAllByText(/👎/);
    fireEvent.click(downvoteButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/ideas/1/vote',
        { voteType: 'downvote' },
        expect.any(Object)
      );
    });
  });

  it('should remove vote when clicking same vote type again', async () => {
    const store = createMockStore();
    mockedAxios.delete.mockResolvedValue({
      data: { success: true, message: 'Vote removed' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Food Bank Support')).toBeInTheDocument();
    });

    const upvoteButtons = screen.getAllByText(/👍/);
    fireEvent.click(upvoteButtons[1]);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:5001/api/ideas/2/vote',
        expect.any(Object)
      );
    });
  });

  it('should display net votes for each idea', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Net: 8')).toBeInTheDocument();
      expect(screen.getByText('Net: 24')).toBeInTheDocument();
      expect(screen.getByText('Net: -3')).toBeInTheDocument();
    });
  });

  it('should navigate to idea detail when card is clicked', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const ideaCard = screen.getByText('Community Garden').closest('div');
    if (ideaCard) {
      fireEvent.click(ideaCard);
    }
  });

  it('should navigate to create idea page when submit button clicked', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    const submitButton = screen.getByText('Submit Idea');
    fireEvent.click(submitButton);
  });

  it('should display category chips with correct colors', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      const environmentChip = screen.getAllByText('Environment')[0];
      expect(environmentChip).toBeInTheDocument();
    });
  });

  it('should display status chips with correct styling', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('submitted')).toBeInTheDocument();
      expect(screen.getByText('approved')).toBeInTheDocument();
      expect(screen.getByText('rejected')).toBeInTheDocument();
    });
  });

  it('should show no ideas message when no results match filters', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search ideas/i);
    fireEvent.change(searchInput, { target: { value: 'NonexistentIdea' } });

    expect(screen.getByText(/No ideas yet/i)).toBeInTheDocument();
  });

  it('should display truncated description for long descriptions', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      const description = screen.getByText(/Create a community garden/i);
      expect(description.textContent?.length).toBeLessThanOrEqual(153);
    });
  });

  it('should prevent voting when not logged in', async () => {
    const store = createMockStore(false);
    window.alert = jest.fn();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Ideas />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/👍/)).not.toBeInTheDocument();
    });
  });
});
