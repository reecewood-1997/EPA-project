import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackSection from './FeedbackSection';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window.confirm
global.confirm = jest.fn(() => true);

describe('FeedbackSection Component', () => {
  const mockEventId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render feedback section title', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={false} />);

    expect(screen.getByText('Event Feedback')).toBeInTheDocument();
  });

  it('should fetch and display feedback statistics', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: null } }) // my feedback
      .mockResolvedValueOnce({ data: { success: true, data: [] } }) // all feedback
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            TotalFeedback: 10,
            AverageRating: 4.5,
            FiveStars: 6,
            FourStars: 3,
            ThreeStars: 1,
            TwoStars: 0,
            OneStar: 0,
            WouldRecommend: 9,
            WouldNotRecommend: 1
          }
        }
      }); // stats

    render(<FeedbackSection eventId={mockEventId} isRegistered={false} />);

    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText(/Based on 10 reviews/i)).toBeInTheDocument();
      expect(screen.getByText('9 would recommend')).toBeInTheDocument();
    });
  });

  it('should show feedback form when user is registered', () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    expect(screen.getByText('Leave Feedback')).toBeInTheDocument();
    expect(screen.getByText('Rating *')).toBeInTheDocument();
    expect(screen.getByLabelText(/Comment/i)).toBeInTheDocument();
  });

  it('should not show feedback form when user is not registered', () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={false} />);

    expect(screen.queryByText('Leave Feedback')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Comment/i)).not.toBeInTheDocument();
  });

  it('should submit feedback with rating and comment', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Feedback submitted successfully' }
    });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    // Set rating
    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]); // 5 stars

    // Set comment
    const commentInput = screen.getByLabelText(/Comment/i);
    fireEvent.change(commentInput, { target: { value: 'Great event!' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://localhost:5001/api/events/${mockEventId}/feedback`,
        { rating: 5, comment: 'Great event!', wouldRecommend: true },
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(screen.getByText('Feedback submitted successfully')).toBeInTheDocument();
    });
  });

  it('should show error when submitting feedback without rating', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    // Button should be disabled when rating is zero, so it cannot be clicked
    // This test verifies that the submit button is properly disabled
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    expect(submitButton).toBeDisabled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should disable submit button when rating is zero', () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when rating is set', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[3]); // 4 stars

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should show Update Feedback button when user has existing feedback', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            FeedbackID: 1,
            Rating: 4,
            Comment: 'Good event',
            WouldRecommend: true
          }
        }
      }) // my feedback
      .mockResolvedValueOnce({ data: { success: true, data: [] } }) // all feedback
      .mockResolvedValueOnce({ data: { success: true, data: null } }); // stats

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    await waitFor(() => {
      expect(screen.getByText('Update Your Feedback')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Feedback/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Feedback/i })).toBeInTheDocument();
    });
  });

  it('should delete feedback when Delete button is clicked', async () => {
    // Mock the additional API calls after deletion
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { FeedbackID: 1, Rating: 4, Comment: 'Good', WouldRecommend: true }
        }
      }) // initial my feedback
      .mockResolvedValueOnce({ data: { success: true, data: [] } }) // initial all feedback
      .mockResolvedValueOnce({ data: { success: true, data: null } }) // initial stats
      .mockResolvedValueOnce({ data: { success: true, data: [] } }) // all feedback after delete
      .mockResolvedValueOnce({ data: { success: true, data: null } }); // stats after delete

    mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Feedback/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete Feedback/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `http://localhost:5001/api/events/${mockEventId}/feedback`,
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });
  });

  it('should display all feedback reviews', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: null } }) // my feedback
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            {
              FeedbackID: 1,
              Rating: 5,
              Comment: 'Amazing event!',
              WouldRecommend: true,
              FirstName: 'John',
              LastName: 'Doe',
              CreatedAt: '2024-01-15T10:00:00'
            },
            {
              FeedbackID: 2,
              Rating: 4,
              Comment: 'Very good',
              WouldRecommend: true,
              FirstName: 'Jane',
              LastName: 'Smith',
              CreatedAt: '2024-01-16T14:00:00'
            }
          ]
        }
      }) // all feedback
      .mockResolvedValueOnce({ data: { success: true, data: null } }); // stats

    render(<FeedbackSection eventId={mockEventId} isRegistered={false} />);

    await waitFor(() => {
      expect(screen.getByText('All Reviews (2)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Amazing event!')).toBeInTheDocument();
      expect(screen.getByText('Very good')).toBeInTheDocument();
    });
  });

  it('should show message when no feedback exists', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: null } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: null } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={false} />);

    await waitFor(() => {
      expect(screen.getByText('All Reviews (0)')).toBeInTheDocument();
      expect(screen.getByText('No feedback yet. Be the first to leave a review!')).toBeInTheDocument();
    });
  });

  it('should handle API error when submitting feedback', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'You have already submitted feedback' }
      }
    });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]);

    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('You have already submitted feedback')).toBeInTheDocument();
    });
  });

  it('should toggle recommend checkbox', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    const checkbox = screen.getByRole('checkbox', { name: /I would recommend this event/i });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
