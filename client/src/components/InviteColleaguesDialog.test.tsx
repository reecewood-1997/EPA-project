import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InviteColleaguesDialog from './InviteColleaguesDialog';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.useFakeTimers();

describe('InviteColleaguesDialog Component', () => {
  const mockOnClose = jest.fn();
  const mockOnInviteSuccess = jest.fn();
  const mockEventId = 123;
  const mockEventTitle = 'Beach Cleanup Event';

  const mockUsers = [
    {
      UserID: 1,
      FirstName: 'John',
      LastName: 'Doe',
      Email: 'john.doe@pwc.com',
      Department: 'IT',
      Location: 'London'
    },
    {
      UserID: 2,
      FirstName: 'Jane',
      LastName: 'Smith',
      Email: 'jane.smith@pwc.com',
      Department: 'Finance',
      Location: 'Manchester'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllTimers();
  });

  it('should render dialog when open', () => {
    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    expect(screen.getByText('Invite Colleagues')).toBeInTheDocument();
    expect(screen.getByText(`Invite colleagues to "${mockEventTitle}"`)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
  });

  it('should search and display users', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockUsers }
    });

    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should select and deselect users', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockUsers }
    });

    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const johnCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(johnCheckbox);

    await waitFor(() => {
      expect(screen.getByText('Selected (1)')).toBeInTheDocument();
    });

    fireEvent.click(johnCheckbox);

    await waitFor(() => {
      expect(screen.queryByText('Selected (1)')).not.toBeInTheDocument();
    });
  });

  it('should send invitations successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockUsers }
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Invitations sent' }
    });

    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onInviteSuccess={mockOnInviteSuccess}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Selected (1)')).toBeInTheDocument();
    });

    const sendButton = screen.getByRole('button', { name: /Send \(1\)/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://localhost:5001/api/events/${mockEventId}/invite`,
        { userIds: [1], message: undefined },
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Invitations sent successfully/i)).toBeInTheDocument();
    });
  });

  it('should show error when sending invitations fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockUsers }
    });

    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Event is full' }
      }
    });

    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    const sendButton = screen.getByRole('button', { name: /Send \(1\)/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Event is full')).toBeInTheDocument();
    });
  });
});
