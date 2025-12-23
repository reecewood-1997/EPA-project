import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EventCard from './EventCard';
import authReducer from '../store/authSlice';
import eventReducer from '../store/eventSlice';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('EventCard Component', () => {
  const mockEvent = {
    id: 1,
    title: 'Beach Cleanup',
    description: 'Help clean up the local beach',
    startDate: '2024-06-15T10:00:00',
    endDate: '2024-06-15T14:00:00',
    location: 'Brighton Beach',
    maxParticipants: 20,
    category: 'Environment',
    participants: [],
    createdBy: {
      id: 1,
      email: 'creator@test.com',
      firstName: 'Creator',
      lastName: 'User',
      role: 'user'
    },
    createdAt: '2024-06-01T00:00:00',
    updatedAt: '2024-06-01T00:00:00'
  };

  const createMockStore = (userId: number | null = 1) => {
    return configureStore({
      reducer: {
        auth: authReducer,
        events: eventReducer
      },
      preloadedState: {
        auth: {
          user: userId ? { id: userId, email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'user' } : null,
          token: userId ? 'test-token' : null,
          isAuthenticated: userId !== null
        },
        events: {
          events: [],
          joinedEvents: []
        }
      }
    });
  };

  it('should render event card with basic information', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
    expect(screen.getByText('Help clean up the local beach')).toBeInTheDocument();
    expect(screen.getByText('📍 Brighton Beach')).toBeInTheDocument();
  });


  it('should show Join Event button when user is logged in and not registered', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventCard event={mockEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Join Event/i })).toBeInTheDocument();
  });

  it('should show Leave Event button when user is registered', () => {
    const store = createMockStore();
    const eventWithParticipant = {
      ...mockEvent,
      participants: [{
        id: 1,
        userId: 1,
        eventId: 1,
        status: 'confirmed' as const,
        user: {
          id: 1,
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user'
        }
      }]
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventCard event={eventWithParticipant} />
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
          <EventCard event={mockEvent} />
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
      maxParticipants: 20,
      participants: new Array(20).fill(null).map((_, i) => ({
        id: i,
        userId: i + 2,
        eventId: 1,
        status: 'confirmed' as const,
        user: {
          id: i + 2,
          email: `user${i}@test.com`,
          firstName: `User${i}`,
          lastName: 'Test',
          role: 'user'
        }
      }))
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventCard event={fullEvent} />
        </BrowserRouter>
      </Provider>
    );

    const joinButton = screen.getByRole('button', { name: /Join Event/i });
    expect(joinButton).toBeDisabled();
  });


  it('should handle events with missing data', () => {
    const store = createMockStore();
    const incompleteEvent = {
      id: 2,
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      maxParticipants: 0,
      category: '',
      participants: [],
      createdBy: {
        id: 1,
        email: 'creator@test.com',
        firstName: 'Creator',
        lastName: 'User',
        role: 'user'
      },
      createdAt: '2024-06-01T00:00:00',
      updatedAt: '2024-06-01T00:00:00'
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <EventCard event={incompleteEvent} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Untitled Event')).toBeInTheDocument();
    expect(screen.getByText('No description available')).toBeInTheDocument();
    expect(screen.getByText('📍 Location TBD')).toBeInTheDocument();
    expect(screen.getByText('Date TBD')).toBeInTheDocument();
  });
});
