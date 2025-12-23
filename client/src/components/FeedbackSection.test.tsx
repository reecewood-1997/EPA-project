import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackSection from './FeedbackSection';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  it('should render feedback section and statistics', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: null } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
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
      });

    render(<FeedbackSection eventId={mockEventId} isRegistered={false} />);

    expect(screen.getByText('Event Feedback')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText(/Based on 10 reviews/i)).toBeInTheDocument();
    });
  });

  it('should show feedback form when user is registered', () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    expect(screen.getByText('Leave Feedback')).toBeInTheDocument();
    expect(screen.getByText('Rating *')).toBeInTheDocument();
    expect(screen.getByLabelText(/Comment/i)).toBeInTheDocument();
  });

  it('should submit feedback successfully', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Feedback submitted successfully' }
    });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]);

    const commentInput = screen.getByLabelText(/Comment/i);
    fireEvent.change(commentInput, { target: { value: 'Great event!' } });

    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://localhost:5001/api/events/${mockEventId}/feedback`,
        { rating: 5, comment: 'Great event!', wouldRecommend: true },
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });
  });

  it('should delete feedback when delete button clicked', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { FeedbackID: 1, Rating: 4, Comment: 'Good', WouldRecommend: true }
        }
      })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: null } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: null } });

    mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={true} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Feedback/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete Feedback/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalled();
    });
  });

  it('should display all feedback reviews', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { success: true, data: null } })
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
            }
          ]
        }
      })
      .mockResolvedValueOnce({ data: { success: true, data: null } });

    render(<FeedbackSection eventId={mockEventId} isRegistered={false} />);

    await waitFor(() => {
      expect(screen.getByText('All Reviews (1)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Amazing event!')).toBeInTheDocument();
    });
  });
});
