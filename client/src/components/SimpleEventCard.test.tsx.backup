import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SimpleEventCard from './SimpleEventCard';
import authReducer from '../store/authSlice';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.alert
global.alert = jest.fn();

describe('SimpleEventCard Component', () => {
  const mockEvent = {
    EventID: 1,
    Title: 'Beach Cleanup',
    Description: 'Help clean up the local beach',
    StartDateTime: '2026-06-15T10:00:00',
    EndDateTime: '2026-06-15T14:00:00',
    Location: 'Brighton Beach',
    MaxParticipants: 20,
    CurrentParticipants: 10,
    CategoryName: 'Environment',
    IsUserRegistered: false,
    IsCreatedByCurrentUser: false,
    CreatedBy: 2
  };

  const createMockStore = (userId: number | null = 1) => {
    return configureStore({
      reducer: {
        auth: authReducer
      },
      preloadedState: {
        auth: {
          user: userId ? { id: userId, email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'employee' } : null,
          token: userId ? 'test-token' : null,
          isAuthenticated: !!userId
        }
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render event card with basic information', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
    expect(screen.getByText('Help clean up the local beach')).toBeInTheDocument();
    expect(screen.getByText(/Brighton Beach/)).toBeInTheDocument();
  });

  it('should display participant count and category', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('10/20 participants')).toBeInTheDocument();
    expect(screen.getByText('Environment')).toBeInTheDocument();
  });

  it('should display formatted date and time', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    const eventDate = new Date('2026-06-15T10:00:00');
    const expectedDate = eventDate.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const expectedTime = eventDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(expectedTime))).toBeInTheDocument();
  });

  it('should navigate to event detail page when card is clicked', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    const card = screen.getByText('Beach Cleanup').closest('div')?.parentElement?.parentElement;
    if (card) {
      fireEvent.click(card);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/events/1');
  });

  it('should show Join Event button when user is logged in and not registered', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Join Event/i })).toBeInTheDocument();
  });

  it('should show Leave Event button when user is registered', () => {
    const store = createMockStore();
    const registeredEvent = { ...mockEvent, IsUserRegistered: true };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={registeredEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Leave Event/i })).toBeInTheDocument();
  });

  it('should not show Join/Leave button when user is not logged in', () => {
    const store = createMockStore(null);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByRole('button', { name: /Join Event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Leave Event/i })).not.toBeInTheDocument();
  });

  it('should disable Join button when event is full', () => {
    const store = createMockStore();
    const fullEvent = {
      ...mockEvent,
      CurrentParticipants: 20,
      MaxParticipants: 20
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={fullEvent} />
        </BrowserRouter>
      </Provider>
    );

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    expect(joinButton).toBeDisabled();
  });

  it('should successfully join event', async () => {
    const store = createMockStore();
    const mockOnRegistrationChange = jest.fn();

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} onRegistrationChange={mockOnRegistrationChange} />
        </BrowserRouter>
      </Provider>
    );

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/events/1/register',
        {},
        { headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' } }
      );
      expect(global.alert).toHaveBeenCalledWith('Successfully registered for event!');
      expect(mockOnRegistrationChange).toHaveBeenCalled();
    });
  });

  it('should successfully leave event', async () => {
    const store = createMockStore();
    const mockOnRegistrationChange = jest.fn();
    const registeredEvent = { ...mockEvent, IsUserRegistered: true };

    mockedAxios.delete.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={registeredEvent} onRegistrationChange={mockOnRegistrationChange} />
        </BrowserRouter>
      </Provider>
    );

    const leaveButton = screen.getByRole('button', { name: /Leave Event/i });
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:5001/api/events/1/unregister',
        { headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' } }
      );
      expect(global.alert).toHaveBeenCalledWith('Successfully left event!');
      expect(mockOnRegistrationChange).toHaveBeenCalled();
    });
  });

  it('should show error message when joining event fails', async () => {
    const store = createMockStore();

    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Event is full' }
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Event is full');
    });
  });

  it('should show generic error when API error has no message', async () => {
    const store = createMockStore();

    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to join event. Please try again.');
    });
  });

  it('should show Edit Event button for event creator', () => {
    const store = createMockStore();
    const creatorEvent = { ...mockEvent, IsCreatedByCurrentUser: true };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={creatorEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Edit Event/i })).toBeInTheDocument();
  });

  it('should navigate to edit page when Edit Event is clicked', () => {
    const store = createMockStore();
    const creatorEvent = { ...mockEvent, IsCreatedByCurrentUser: true };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={creatorEvent} />
        </BrowserRouter>
      </Provider>
    );

    const editButton = screen.getByRole('button', { name: /Edit Event/i });
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/edit-event/1');
  });

  it('should show "Event Completed" chip for past events', () => {
    const store = createMockStore();
    const pastEvent = {
      ...mockEvent,
      StartDateTime: '2020-01-01T10:00:00'
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={pastEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Event Completed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Join Event/i })).not.toBeInTheDocument();
  });

  it('should handle events with missing data gracefully', () => {
    const store = createMockStore();
    const incompleteEvent = {
      EventID: 2,
      Title: null,
      Description: null,
      StartDateTime: '2026-06-15T10:00:00',
      Location: null,
      MaxParticipants: 0,
      CurrentParticipants: 0,
      CategoryName: null
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={incompleteEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Untitled Event')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
    expect(screen.getByText(/Location TBD/)).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('should show Loading... text while joining event', async () => {
    const store = createMockStore();

    mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    fireEvent.click(joinButton);

    expect(screen.getByRole('button', { name: /Loading.../i })).toBeInTheDocument();
  });

  it('should stop event propagation when action buttons are clicked', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SimpleEventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    const stopPropagationSpy = jest.fn();

    // Simulate clicking the button
    joinButton.parentElement?.addEventListener('click', (e) => {
      stopPropagationSpy();
    });

    fireEvent.click(joinButton);

    // The card navigation should not be triggered when clicking the button
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
