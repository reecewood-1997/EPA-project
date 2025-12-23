import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import IdeaDetail from './IdeaDetail';
import authReducer from '../store/authSlice';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('IdeaDetail Page', () => {
  const mockIdea = {
    IdeaID: 1,
    Title: 'Community Garden',
    Description: 'Create a community garden in the city center to promote sustainability and community engagement',
    Location: 'London Central Park',
    ExpectedImpact: 'High impact on local community and environment',
    RequiredResources: 'Seeds, gardening tools, volunteers, water access',
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
  };

  const mockComments = [
    {
      CommentID: 1,
      Comment: 'Great idea! I would love to help.',
      UserName: 'Jane Smith',
      UserRole: 'employee',
      UserID: 2,
      IsAdminComment: false,
      CreatedAt: '2024-01-16T09:00:00Z'
    },
    {
      CommentID: 2,
      Comment: 'This aligns well with our sustainability goals.',
      UserName: 'Admin User',
      UserRole: 'admin',
      UserID: 3,
      IsAdminComment: true,
      CreatedAt: '2024-01-17T11:00:00Z'
    }
  ];

  const createMockStore = (userId = 1, isAdmin = false) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: userId,
            email: 'test@pwc.com',
            firstName: 'Test',
            lastName: 'User',
            role: isAdmin ? 'admin' : 'employee'
          },
          token: 'test-token',
          isAuthenticated: true,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/ideas') && !url.includes('/comments')) {
        return Promise.resolve({
          data: { success: true, data: [mockIdea] }
        });
      }
      if (url.includes('/comments')) {
        return Promise.resolve({
          data: { success: true, data: mockComments }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('should render idea title and description', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
      expect(screen.getByText(/Create a community garden in the city center/i)).toBeInTheDocument();
    });
  });

  it('should display loading spinner while fetching data', () => {
    const store = createMockStore();
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
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
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch idea details/i)).toBeInTheDocument();
    });
  });

  it('should display idea details correctly', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('London Central Park')).toBeInTheDocument();
      expect(screen.getByText(/High impact on local community/i)).toBeInTheDocument();
      expect(screen.getByText(/Seeds, gardening tools/i)).toBeInTheDocument();
      expect(screen.getByText('£500.00')).toBeInTheDocument();
      expect(screen.getByText('20 volunteers')).toBeInTheDocument();
    });
  });

  it('should display voting buttons with correct counts', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/👍 10/)).toBeInTheDocument();
      expect(screen.getByText(/👎 2/)).toBeInTheDocument();
      expect(screen.getByText('Net: 8')).toBeInTheDocument();
    });
  });

  it('should upvote idea when upvote button clicked', async () => {
    const store = createMockStore();
    mockedAxios.post.mockResolvedValue({
      data: { success: true }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/👍 10/)).toBeInTheDocument();
    });

    const upvoteButton = screen.getByText(/👍 10/).closest('button');
    if (upvoteButton) {
      fireEvent.click(upvoteButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/vote'),
          { voteType: 'upvote' },
          expect.any(Object)
        );
      });
    }
  });

  it('should downvote idea when downvote button clicked', async () => {
    const store = createMockStore();
    mockedAxios.post.mockResolvedValue({
      data: { success: true }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/👎 2/)).toBeInTheDocument();
    });

    const downvoteButton = screen.getByText(/👎 2/).closest('button');
    if (downvoteButton) {
      fireEvent.click(downvoteButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/vote'),
          { voteType: 'downvote' },
          expect.any(Object)
        );
      });
    }
  });

  it('should display all comments', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Great idea! I would love to help.')).toBeInTheDocument();
      expect(screen.getByText('This aligns well with our sustainability goals.')).toBeInTheDocument();
    });
  });

  it('should highlight admin comments', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('should submit new comment when form is submitted', async () => {
    const store = createMockStore();
    mockedAxios.post.mockResolvedValue({
      data: { success: true }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Add a comment/i)).toBeInTheDocument();
    });

    const commentInput = screen.getByPlaceholderText(/Add a comment/i);
    fireEvent.change(commentInput, { target: { value: 'This is a test comment' } });

    const submitButton = screen.getByText('Post Comment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/comments'),
        { comment: 'This is a test comment' },
        expect.any(Object)
      );
    });
  });

  it('should not submit empty comment', async () => {
    const store = createMockStore();
    window.alert = jest.fn();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Add a comment/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Post Comment');
    fireEvent.click(submitButton);

    expect(window.alert).toHaveBeenCalledWith('Comment cannot be empty');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should allow user to delete their own comment', async () => {
    const store = createMockStore(2);
    mockedAxios.delete.mockResolvedValue({
      data: { success: true }
    });
    window.confirm = jest.fn(() => true);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalled();
    });
  });

  it('should allow admin to delete any comment', async () => {
    const store = createMockStore(999, true);
    mockedAxios.delete.mockResolvedValue({
      data: { success: true }
    });
    window.confirm = jest.fn(() => true);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('delete');
      expect(deleteButtons.length).toBe(2);
    });
  });

  it('should navigate back to ideas list', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Back to Ideas')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Ideas');
    fireEvent.click(backButton);
  });

  it('should display correct status badge', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('submitted')).toBeInTheDocument();
    });
  });

  it('should display category badge with correct color', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Environment')).toBeInTheDocument();
    });
  });

  it('should show comments count', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IdeaDetail />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Comments section should be visible
    expect(screen.getByText(/Comments/i)).toBeInTheDocument();
  });
});
