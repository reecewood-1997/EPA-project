import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Layout from './Layout';
import authReducer from '../store/authSlice';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock NotificationBell component
jest.mock('./NotificationBell', () => {
  return function MockNotificationBell() {
    return <div data-testid="notification-bell">NotificationBell</div>;
  };
});

describe('Layout Component', () => {
  const createMockStore = (user: any = null) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user,
          token: user ? 'test-token' : null,
          isAuthenticated: user !== null,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the app bar with title', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('PwC One Firm One Day')).toBeInTheDocument();
  });

  it('should render children content', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should not show navigation buttons when user is not logged in', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByRole('button', { name: /Events/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ideas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Logout/i })).not.toBeInTheDocument();
  });

  it('should show navigation buttons when user is logged in', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Events/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  it('should show NotificationBell when user is logged in', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('should show Admin button only for admin users', () => {
    const store = createMockStore({
      id: 1,
      email: 'admin@pwc.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /Admin/i })).toBeInTheDocument();
  });

  it('should not show Admin button for regular users', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByRole('button', { name: /Admin/i })).not.toBeInTheDocument();
  });

  it('should navigate to /events when Events button is clicked', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const eventsButton = screen.getByRole('button', { name: /Events/i });
    fireEvent.click(eventsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('should navigate to /calendar when Calendar button is clicked', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const calendarButton = screen.getByRole('button', { name: /Calendar/i });
    fireEvent.click(calendarButton);

    expect(mockNavigate).toHaveBeenCalledWith('/calendar');
  });

  it('should navigate to /ideas when Ideas button is clicked', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const ideasButton = screen.getByRole('button', { name: /Ideas/i });
    fireEvent.click(ideasButton);

    expect(mockNavigate).toHaveBeenCalledWith('/ideas');
  });

  it('should navigate to /admin when Admin button is clicked', () => {
    const store = createMockStore({
      id: 1,
      email: 'admin@pwc.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const adminButton = screen.getByRole('button', { name: /Admin/i });
    fireEvent.click(adminButton);

    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('should navigate to /events/create when Create Event button is clicked', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const createEventButton = screen.getByRole('button', { name: /Create Event/i });
    fireEvent.click(createEventButton);

    expect(mockNavigate).toHaveBeenCalledWith('/events/create');
  });

  it('should navigate to /profile when Profile button is clicked', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const profileButton = screen.getByRole('button', { name: /Profile/i });
    fireEvent.click(profileButton);

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('should navigate to /events when logged-in user clicks title', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const title = screen.getByText('PwC One Firm One Day');
    fireEvent.click(title);

    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('should navigate to / when non-logged-in user clicks title', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const title = screen.getByText('PwC One Firm One Day');
    fireEvent.click(title);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should dispatch logout and navigate to /login when Logout is clicked', () => {
    const store = createMockStore({
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      </Provider>
    );

    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    // User should be logged out (store state should change)
    const state = store.getState();
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
  });
});
