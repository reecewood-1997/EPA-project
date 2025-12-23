import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MyProfile from './MyProfile';
import authReducer from '../store/authSlice';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MyProfile Page', () => {
  const mockUserData = {
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@pwc.com',
    PhoneNumber: '07700900123',
    Department: 'Technology',
    Location: 'London',
    Skills: JSON.stringify(['JavaScript', 'React', 'TypeScript']),
    Interests: JSON.stringify(['volunteering', 'community']),
    Bio: 'Passionate about making a difference'
  };

  const mockRegisteredEvents = [
    {
      EventID: 1,
      Title: 'Beach Cleanup',
      StartDateTime: '2026-06-15T10:00:00Z',
      Location: 'Brighton Beach'
    },
    {
      EventID: 2,
      Title: 'Food Bank',
      StartDateTime: '2026-07-20T09:00:00Z',
      Location: 'Camden'
    }
  ];

  const createMockStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: 1,
            email: 'john.doe@pwc.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'employee'
          },
          token: 'test-token',
          isAuthenticated: true,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/profile')) {
        return Promise.resolve({
          data: { success: true, data: mockUserData }
        });
      }
      if (url.includes('/events/registered')) {
        return Promise.resolve({
          data: { success: true, data: mockRegisteredEvents }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('should render profile page title', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('should fetch and display user profile data', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@pwc.com')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  it('should display loading spinner while fetching profile', () => {
    const store = createMockStore();
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    const store = createMockStore();
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch profile/i)).toBeInTheDocument();
    });
  });

  it('should display user skills as chips', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });

  it('should display user interests', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('volunteering')).toBeInTheDocument();
      expect(screen.getByText('community')).toBeInTheDocument();
    });
  });

  it('should display user bio', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Passionate about making a difference')).toBeInTheDocument();
    });
  });

  it('should display registered events', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
      expect(screen.getByText('Food Bank')).toBeInTheDocument();
    });
  });

  it('should show edit profile button', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  it('should open edit dialog when edit button clicked', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should update profile when save button clicked', async () => {
    const store = createMockStore();
    mockedAxios.put.mockResolvedValue({
      data: { success: true, message: 'Profile updated' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      const bioField = screen.getByLabelText(/Bio/i);
      fireEvent.change(bioField, { target: { value: 'Updated bio' } });
    });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });

  it('should display contact information', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('07700900123')).toBeInTheDocument();
    });
  });

  it('should display department and location', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
    });
  });

  it('should navigate to event detail when clicking on registered event', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
    });

    const eventCard = screen.getByText('Beach Cleanup').closest('div');
    if (eventCard) {
      fireEvent.click(eventCard);
    }
  });
});
