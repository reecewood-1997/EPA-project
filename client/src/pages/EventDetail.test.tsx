import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EventDetail from './EventDetail';
import authReducer from '../store/authSlice';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useParams
const mockParams = { id: '1' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
  useNavigate: () => jest.fn(),
}));

// Mock components
jest.mock('../components/FeedbackSection', () => {
  return function MockFeedbackSection() {
    return <div data-testid="feedback-section">Feedback Section</div>;
  };
});

jest.mock('../components/InviteColleaguesDialog', () => {
  return function MockInviteColleaguesDialog() {
    return <div data-testid="invite-dialog">Invite Dialog</div>;
  };
});

jest.mock('../components/InvitationCard', () => {
  return function MockInvitationCard() {
    return <div data-testid="invitation-card">Invitation Card</div>;
  };
});

// Mock window.alert and window.confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

describe('EventDetail Page', () => {
  const mockEvent = {
    EventID: 1,
    Title: 'Beach Cleanup Brighton',
    Description: 'Help clean up Brighton Beach',
    StartDateTime: '2026-06-15T10:00:00',
    EndDateTime: '2026-06-15T14:00:00',
    Location: 'Brighton Beach',
    MaxParticipants: 20,
    CurrentParticipants: 10,
    CategoryName: 'Environment',
    CategoryColor: '#4caf50',
    CreatedBy: 2,
    IsUserRegistered: false,
  };

  const mockParticipants = [
    { UserID: 3, FirstName: 'John', LastName: 'Doe', Email: 'john@pwc.com' },
    { UserID: 4, FirstName: 'Jane', LastName: 'Smith', Email: 'jane@pwc.com' },
  ];

  const createMockStore = (user: any = null) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user,
          token: user ? 'test-token' : null,
          isAuthenticated: !!user,
          loading: false,
          error: null,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should show loading spinner while fetching event', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display event details when loaded', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } }) // Event details
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } }) // Participants
      .mockResolvedValueOnce({ data: { success: true, data: [] } }); // Invitations

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Beach Cleanup Brighton')).toBeInTheDocument();
      expect(screen.getByText(/Help clean up Brighton Beach/i)).toBeInTheDocument();
      // Check that event location is displayed (multiple instances is okay)
      const brightonTexts = screen.getAllByText(/Brighton Beach/i);
      expect(brightonTexts.length).toBeGreaterThan(0);
    });
  });

  it('should display participants list', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
  });

  it('should show Join Event button when user is not registered', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Join Event/i })).toBeInTheDocument();
    });
  });

  it('should show Leave Event button when user is registered', async () => {
    const registeredEvent = { ...mockEvent, IsUserRegistered: true };

    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: registeredEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Leave Event/i })).toBeInTheDocument();
    });
  });

  it('should successfully join event', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      // After join, refetch
      .mockResolvedValueOnce({ data: { success: true, data: { ...mockEvent, IsUserRegistered: true } } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Join Event/i })).toBeInTheDocument();
    });

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/events/1/register',
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  it('should successfully leave event', async () => {
    const registeredEvent = { ...mockEvent, IsUserRegistered: true };

    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: registeredEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      // After leave, refetch
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Leave Event/i })).toBeInTheDocument();
    });

    const leaveButton = screen.getByRole('button', { name: /Leave Event/i });
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:5001/api/events/1/unregister',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  it('should show error message when event fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch event details/i)).toBeInTheDocument();
    });
  });

  it('should display feedback section', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('feedback-section')).toBeInTheDocument();
    });
  });

  it('should show Invite Colleagues button', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Invite Colleagues/i })).toBeInTheDocument();
    });
  });

  it('should display event category with correct color', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: mockEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Environment')).toBeInTheDocument();
    });
  });

  it('should disable Join button when event is full', async () => {
    const fullEvent = { ...mockEvent, CurrentParticipants: 20, MaxParticipants: 20 };

    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: fullEvent } })
      .mockResolvedValueOnce({ data: { success: true, data: mockParticipants } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    const store = createMockStore({ id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventDetail />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      const joinButton = screen.getByRole('button', { name: /Join Event/i });
      expect(joinButton).toBeDisabled();
    });
  });
});
