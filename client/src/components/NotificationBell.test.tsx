import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from './NotificationBell';
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

describe('NotificationBell Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render notification bell icon', () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, count: 0 }
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display unread count badge', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, count: 5 }
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    await waitFor(() => {
      const badge = screen.getByText('5');
      expect(badge).toBeInTheDocument();
    });
  });

  it('should fetch notifications when bell is clicked', async () => {
    // Mock unread count
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, count: 2 }
    });

    // Mock notifications list
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            NotificationID: 1,
            Type: 'event_invitation',
            Title: 'Test Notification',
            Message: 'Test message',
            RelatedEntityType: 'event',
            RelatedEntityID: 1,
            ActionURL: '/events/1',
            IsRead: false,
            CreatedAt: new Date().toISOString()
          }
        ]
      }
    });

    // Mock mark all as read
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    // Wait for unread count to load
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Click the notification bell
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Verify mark all as read was called
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://localhost:5001/api/notifications/read-all',
      {},
      { headers: { Authorization: 'Bearer test-token' } }
    );
  });

  it('should navigate when notification is clicked', async () => {
    // Mock unread count
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, count: 1 }
    });

    // Mock notifications list
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            NotificationID: 1,
            Type: 'event_invitation',
            Title: 'Event Invitation',
            Message: 'You have been invited',
            RelatedEntityType: 'event',
            RelatedEntityID: 10,
            ActionURL: '/events/10',
            IsRead: false,
            CreatedAt: new Date().toISOString()
          }
        ]
      }
    });

    // Mock mark all as read
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    // Click the bell to open menu
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    // Wait for notification to appear
    await waitFor(() => {
      expect(screen.getByText('Event Invitation')).toBeInTheDocument();
    });

    // Click the notification
    const notification = screen.getByText('Event Invitation');
    fireEvent.click(notification);

    // Verify navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/events/10');
    });
  });

  it('should display "No notifications" when empty', async () => {
    // Mock unread count
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, count: 0 }
    });

    // Mock empty notifications list
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: []
      }
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    // Click the bell
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    // Wait for message
    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock failed API call
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching unread count:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
