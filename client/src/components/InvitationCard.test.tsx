import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvitationCard from './InvitationCard';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('InvitationCard Component', () => {
  const mockInvitation = {
    InvitationID: 1,
    InviterFirstName: 'John',
    InviterLastName: 'Doe',
    Message: 'Please join us for this great event!',
    Status: 'Pending'
  };

  const mockOnRespond = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render invitation card with inviter name', () => {
    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/has invited you to this event/)).toBeInTheDocument();
  });

  it('should display personal message when provided', () => {
    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    expect(screen.getByText(/"Please join us for this great event!"/)).toBeInTheDocument();
  });

  it('should not display message section when no message', () => {
    const invitationWithoutMessage = { ...mockInvitation, Message: null };
    render(<InvitationCard invitation={invitationWithoutMessage} onRespond={mockOnRespond} />);

    expect(screen.queryByText(/"Please join us for this great event!"/)).not.toBeInTheDocument();
  });

  it('should have Accept and Decline buttons', () => {
    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
  });

  it('should call API and onRespond when Accept is clicked', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true }
    });

    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5001/api/invitations/1/respond',
        { status: 'Accepted' },
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(mockOnRespond).toHaveBeenCalled();
    });
  });

  it('should call API and onRespond when Decline is clicked', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true }
    });

    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    const declineButton = screen.getByRole('button', { name: /Decline/i });
    fireEvent.click(declineButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5001/api/invitations/1/respond',
        { status: 'Declined' },
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(mockOnRespond).toHaveBeenCalled();
    });
  });

  it('should disable buttons while loading', async () => {
    mockedAxios.put.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    const declineButton = screen.getByRole('button', { name: /Decline/i });

    fireEvent.click(acceptButton);

    // Buttons should be disabled during API call
    expect(acceptButton).toBeDisabled();
    expect(declineButton).toBeDisabled();
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Event is already full';
    mockedAxios.put.mockRejectedValueOnce({
      response: {
        data: { message: errorMessage }
      }
    });

    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // onRespond should not be called on error
    expect(mockOnRespond).not.toHaveBeenCalled();
  });

  it('should display generic error message when API error has no message', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Network error'));

    render(<InvitationCard invitation={mockInvitation} onRespond={mockOnRespond} />);

    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to respond to invitation')).toBeInTheDocument();
    });
  });
});
