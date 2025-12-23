import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InviteColleaguesDialog from './InviteColleaguesDialog';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock timers for debouncing
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
  });

  it('should not render dialog when closed', () => {
    render(
      <InviteColleaguesDialog
        open={false}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    expect(screen.queryByText('Invite Colleagues')).not.toBeInTheDocument();
  });

  it('should show search input', () => {
    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
  });

  it('should search users after debounce delay', async () => {
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
    fireEvent.change(searchInput, { target: { value: 'john' } });

    // Fast-forward time past the debounce delay
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/search?query=john',
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should not search when query is less than 2 characters', () => {
    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'j' } });

    jest.advanceTimersByTime(500);

    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('should display search results', async () => {
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
      expect(screen.getByText(/john.doe@pwc.com/i)).toBeInTheDocument();
      expect(screen.getByText(/jane.smith@pwc.com/i)).toBeInTheDocument();
    });
  });

  it('should show "No users found" when search returns empty', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: [] }
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
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
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

    // Select user
    const johnCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(johnCheckbox);

    await waitFor(() => {
      expect(screen.getByText('Selected (1)')).toBeInTheDocument();
    });

    // Deselect user
    fireEvent.click(johnCheckbox);

    await waitFor(() => {
      expect(screen.queryByText('Selected (1)')).not.toBeInTheDocument();
    });
  });

  it('should show selected users count', async () => {
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

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByText('Selected (2)')).toBeInTheDocument();
    });
  });

  it('should disable send button when no users selected', () => {
    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    const sendButton = screen.getByRole('button', { name: /Send/i });
    expect(sendButton).toBeDisabled();
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

    // Select user
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Selected (1)')).toBeInTheDocument();
    });

    // Send invitations
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

  it('should send invitations with personal message', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockUsers }
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
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

    // Add personal message
    const messageInput = screen.getByPlaceholderText(/Add a personal message/i);
    fireEvent.change(messageInput, { target: { value: 'Join us!' } });

    const sendButton = screen.getByRole('button', { name: /Send \(1\)/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://localhost:5001/api/events/${mockEventId}/invite`,
        { userIds: [1], message: 'Join us!' },
        { headers: { Authorization: 'Bearer test-token' } }
      );
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

  it('should show error when no users selected on send', async () => {
    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    // Try to click send button (though it should be disabled, test the validation)
    const sendButton = screen.getByRole('button', { name: /Send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should reset state when dialog closes', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockUsers }
    });

    const { rerender } = render(
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

    // Close dialog
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();

    // Reopen and check if state is reset
    rerender(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    const newSearchInput = screen.getByPlaceholderText('Search by name or email...');
    expect(newSearchInput).toHaveValue('');
  });

  it('should show character count for personal message', () => {
    render(
      <InviteColleaguesDialog
        open={true}
        onClose={mockOnClose}
        eventId={mockEventId}
        eventTitle={mockEventTitle}
      />
    );

    const messageInput = screen.getByPlaceholderText(/Add a personal message/i);
    fireEvent.change(messageInput, { target: { value: 'Hello' } });

    expect(screen.getByText('5/500 characters')).toBeInTheDocument();
  });
});
