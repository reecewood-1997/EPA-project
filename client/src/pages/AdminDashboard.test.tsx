import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdminDashboard from './AdminDashboard';
import authReducer from '../store/authSlice';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AdminDashboard', () => {
  const mockIdeas = [
    {
      IdeaID: 1,
      Title: 'Community Garden',
      Description: 'Create a community garden',
      Location: 'London',
      ExpectedImpact: 'High',
      RequiredResources: 'Seeds, tools',
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
      Description: 'Support local food bank',
      Location: 'Manchester',
      ExpectedImpact: 'Very High',
      RequiredResources: 'Volunteers',
      EstimatedCost: 100,
      EstimatedParticipants: 15,
      Status: 'under_review',
      CategoryName: 'Community',
      CategoryColor: '#2196f3',
      SubmittedBy: 'Jane Smith',
      UpvoteCount: 25,
      DownvoteCount: 1,
      NetVotes: 24,
      UserVote: null,
      IsCreatedByCurrentUser: false,
      CreatedAt: '2024-01-10T09:00:00Z'
    }
  ];

  const createMockStore = (isAdmin = true) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: 1,
            email: 'admin@pwc.com',
            firstName: 'Admin',
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
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: mockIdeas }
    });
  });

  it('should render admin dashboard title', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should fetch and display ideas on mount', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
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
    });
  });

  it('should display loading spinner while fetching ideas', () => {
    const store = createMockStore();

    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    const store = createMockStore();
    mockedAxios.get.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch ideas/i)).toBeInTheDocument();
    });
  });

  it('should filter ideas by status', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/Status/i);
    fireEvent.change(statusFilter, { target: { value: 'under_review' } });

    expect(screen.queryByText('Community Garden')).not.toBeInTheDocument();
    expect(screen.getByText('Food Bank Support')).toBeInTheDocument();
  });

  it('should approve an idea when approve button is clicked', async () => {
    const store = createMockStore();
    mockedAxios.put.mockResolvedValue({
      data: { success: true, message: 'Idea approved' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText(/Approve/i);
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5001/api/ideas/1/status',
        { status: 'approved' },
        expect.any(Object)
      );
    });
  });

  it('should reject an idea when reject button is clicked', async () => {
    const store = createMockStore();
    mockedAxios.put.mockResolvedValue({
      data: { success: true, message: 'Idea rejected' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText(/Reject/i);
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5001/api/ideas/1/status',
        { status: 'rejected' },
        expect.any(Object)
      );
    });
  });

  it('should display idea statistics', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Ideas:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('should navigate to idea detail when clicking on idea', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const ideaCard = screen.getByText('Community Garden').closest('div[role="button"]') ||
                     screen.getByText('Community Garden');

    fireEvent.click(ideaCard);

    await waitFor(() => {
      expect(window.location.pathname).toContain('/ideas/');
    });
  });

  it('should display net votes for each idea', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Net: 8/i)).toBeInTheDocument();
      expect(screen.getByText(/Net: 24/i)).toBeInTheDocument();
    });
  });

  it('should convert approved idea to event', async () => {
    const store = createMockStore();
    mockedAxios.put.mockResolvedValue({
      data: { success: true, message: 'Idea approved' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const createEventButtons = screen.getAllByText(/Create Event/i);
    if (createEventButtons.length > 0) {
      fireEvent.click(createEventButtons[0]);

      await waitFor(() => {
        expect(window.location.pathname).toContain('/create-event');
      });
    }
  });

  it('should refresh data after status change', async () => {
    const store = createMockStore();
    mockedAxios.put.mockResolvedValue({
      data: { success: true, message: 'Idea approved' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Garden')).toBeInTheDocument();
    });

    const initialCallCount = mockedAxios.get.mock.calls.length;

    const approveButtons = screen.getAllByText(/Approve/i);
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should redirect non-admin users', () => {
    const store = createMockStore(false);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});
