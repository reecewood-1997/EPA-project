import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Events from './Events';
import authReducer from '../store/authSlice';
import * as useEventsHook from '../hooks/useEvents';

// Mock fetch
global.fetch = jest.fn();

// Mock SimpleEventCard
jest.mock('../components/SimpleEventCard', () => {
  return function MockSimpleEventCard({ event }: any) {
    return <div data-testid={`event-${event.id}`}>{event.title}</div>;
  };
});

describe('Events Page', () => {
  const mockEvents = [
    {
      id: 1,
      title: 'Beach Cleanup Brighton',
      description: 'Clean up Brighton Beach',
      startDate: '2026-06-15T10:00:00',
      endDate: '2026-06-15T14:00:00',
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
      createdAt: '2026-06-01T00:00:00',
      updatedAt: '2026-06-01T00:00:00'
    },
    {
      id: 2,
      title: 'Food Bank London',
      description: 'Help at the food bank',
      startDate: '2026-07-20T09:00:00',
      endDate: '2026-07-20T14:00:00',
      location: 'Camden, London',
      maxParticipants: 15,
      category: 'Community',
      participants: [],
      createdBy: {
        id: 1,
        email: 'creator@test.com',
        firstName: 'Creator',
        lastName: 'User',
        role: 'user'
      },
      createdAt: '2026-07-01T00:00:00',
      updatedAt: '2026-07-01T00:00:00'
    },
    {
      id: 3,
      title: 'Park Cleanup Manchester',
      description: 'Clean up local park',
      startDate: '2023-01-15T10:00:00', // Past event
      endDate: '2023-01-15T14:00:00',
      location: 'Manchester',
      maxParticipants: 25,
      category: 'Environment',
      participants: new Array(20).fill(null).map((_, i) => ({
        id: i,
        userId: i + 2,
        eventId: 3,
        status: 'confirmed' as const,
        user: {
          id: i + 2,
          email: `user${i}@test.com`,
          firstName: `User${i}`,
          lastName: 'Test',
          role: 'user'
        }
      })),
      createdBy: {
        id: 1,
        email: 'creator@test.com',
        firstName: 'Creator',
        lastName: 'User',
        role: 'user'
      },
      createdAt: '2023-01-01T00:00:00',
      updatedAt: '2023-01-01T00:00:00'
    },
  ];

  const mockCategories = [
    { CategoryID: 1, CategoryName: 'Environment', Description: 'Environmental events', Color: '#4caf50' },
    { CategoryID: 2, CategoryName: 'Community', Description: 'Community events', Color: '#2196f3' },
  ];

  const createMockStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: 'employee' },
          token: 'test-token',
          isAuthenticated: true,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useEvents hook
    jest.spyOn(useEventsHook, 'useEvents').mockReturnValue({
      events: mockEvents,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Mock fetch for categories
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockCategories }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render page title and filters', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Volunteer Events')).toBeInTheDocument();
    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument();
    // Verify filter labels are present
    expect(screen.getAllByText('Category').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Location').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Date').length).toBeGreaterThan(0);
  });

  it('should display all events by default', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.getByTestId('event-2')).toBeInTheDocument();
    // Event 3 is past, but 'upcoming' is default, so it should not show
    expect(screen.queryByTestId('event-3')).not.toBeInTheDocument();
  });

  it('should filter events by search term', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Brighton' } });

    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.queryByTestId('event-2')).not.toBeInTheDocument();
  });

  it('should fetch categories on component mount', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    // Verify categories are fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5001/api/events/categories');
    });
  });

  it('should filter events by search in description', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'food bank' } });

    expect(screen.queryByTestId('event-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('event-2')).toBeInTheDocument();
  });

  it('should display only upcoming events by default', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    // Past event (event 3) should not be displayed
    expect(screen.queryByTestId('event-3')).not.toBeInTheDocument();
    // Future events should be displayed
    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.getByTestId('event-2')).toBeInTheDocument();
  });

  it('should clear search results when search is empty', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    const searchInput = screen.getByLabelText(/Search/i);

    // Search for something
    fireEvent.change(searchInput, { target: { value: 'Brighton' } });
    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.queryByTestId('event-2')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.getByTestId('event-2')).toBeInTheDocument();
  });

  it('should show loading spinner when events are loading', () => {
    jest.spyOn(useEventsHook, 'useEvents').mockReturnValue({
      events: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    jest.spyOn(useEventsHook, 'useEvents').mockReturnValue({
      events: [],
      loading: false,
      error: 'Failed to load events',
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Failed to load events')).toBeInTheDocument();
  });

  it('should show no events message when no events match filters', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'NonexistentEvent' } });

    expect(screen.getByText('No events found matching your criteria')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search filters/i)).toBeInTheDocument();
  });

  it('should handle case-insensitive search', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Events />
        </BrowserRouter>
      </Provider>
    );

    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'BEACH' } });

    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.queryByTestId('event-2')).not.toBeInTheDocument();
  });
});
