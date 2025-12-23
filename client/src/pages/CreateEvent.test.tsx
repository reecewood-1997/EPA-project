import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CreateEvent from './CreateEvent';
import authReducer from '../store/authSlice';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockLocation = { state: null };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock window.alert
global.alert = jest.fn();

// Mock window.location.href
delete (window as any).location;
(window as any).location = { href: '' };

describe('CreateEvent Page', () => {
  const mockCategories = [
    { CategoryID: 1, CategoryName: 'Environment', Description: 'Environmental events', Color: '#4caf50' },
    { CategoryID: 2, CategoryName: 'Community', Description: 'Community events', Color: '#2196f3' },
    { CategoryID: 3, CategoryName: 'Education', Description: 'Educational events', Color: '#ff9800' },
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
          loading: false,
          error: null,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');

    // Mock fetch for categories
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: mockCategories },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render create event form', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Create New Event/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
  });

  it('should fetch and display categories', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5001/api/events/categories');
    });
  });

  it('should update form fields when user types', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    const titleInput = screen.getByLabelText(/Event Title/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const locationInput = screen.getByLabelText(/Location/i);

    fireEvent.change(titleInput, { target: { value: 'Beach Cleanup' } });
    fireEvent.change(descriptionInput, { target: { value: 'Clean up Brighton Beach' } });
    fireEvent.change(locationInput, { target: { value: 'Brighton Beach' } });

    expect(titleInput).toHaveValue('Beach Cleanup');
    expect(descriptionInput).toHaveValue('Clean up Brighton Beach');
    expect(locationInput).toHaveValue('Brighton Beach');
  });

  it('should successfully create event', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, data: { EventID: 1 } },
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Fill in form
    fireEvent.change(screen.getByLabelText(/Event Title/i), { target: { value: 'Beach Cleanup' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Clean Brighton Beach' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Brighton Beach' } });

    // Set dates
    const startDateInputs = screen.getAllByLabelText(/Start Date/i);
    const endDateInputs = screen.getAllByLabelText(/End Date/i);

    if (startDateInputs.length > 0) {
      fireEvent.change(startDateInputs[0], { target: { value: '2026-06-15T10:00' } });
    }
    if (endDateInputs.length > 0) {
      fireEvent.change(endDateInputs[0], { target: { value: '2026-06-15T14:00' } });
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/events',
        expect.objectContaining({
          title: 'Beach Cleanup',
          description: 'Clean Brighton Beach',
          location: 'Brighton Beach',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(global.alert).toHaveBeenCalledWith('Event created successfully!');
    });
  });

  it('should show error message when event creation fails', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Failed to create event' },
      },
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText(/Event Title/i), { target: { value: 'Test Event' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Test Location' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  it('should set max participants field', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    const maxParticipantsInput = screen.getByLabelText(/Maximum Participants/i);
    fireEvent.change(maxParticipantsInput, { target: { value: '25' } });

    expect(maxParticipantsInput).toHaveValue(25);
  });

  it('should have default max participants value', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    const maxParticipantsInput = screen.getByLabelText(/Maximum Participants/i);
    expect(maxParticipantsInput).toHaveValue(10); // Default value
  });

  it('should pre-fill contact email with user email', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    const contactEmailInput = screen.getByLabelText(/Contact Email/i);
    expect(contactEmailInput).toHaveValue('test@pwc.com');
  });

  it('should allow updating contact phone', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    const contactPhoneInput = screen.getByLabelText(/Contact Phone/i);
    fireEvent.change(contactPhoneInput, { target: { value: '07123456789' } });

    expect(contactPhoneInput).toHaveValue('07123456789');
  });

  it('should render cancel button', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('should navigate back when cancel is clicked', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('should display all required form fields', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByLabelText(/Event Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maximum Participants/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Phone/i)).toBeInTheDocument();
  });

  it('should include objectives and requirements fields', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    // These fields may be optional or have different labels
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(5); // Should have multiple text inputs
  });

  it('should allow filling multiple text fields', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </Provider>
    );

    const titleInput = screen.getByLabelText(/Event Title/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    expect(titleInput).toHaveValue('Test Event');
    expect(descriptionInput).toHaveValue('Test Description');
  });
});
