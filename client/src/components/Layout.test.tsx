import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Layout from './Layout';
import authReducer from '../store/authSlice';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./NotificationBell', () => {
  return function MockNotificationBell() {
    return <div>MockNotificationBell</div>;
  };
});

describe('Layout Component', () => {
  const createMockStore = (isAuthenticated = false, isAdmin = false) => {
    return configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: isAuthenticated ? { id: 1, email: 'test@pwc.com', firstName: 'Test', lastName: 'User', role: isAdmin ? 'admin' : 'employee' } : null,
          token: isAuthenticated ? 'test-token' : null,
          isAuthenticated
        }
      }
    });
  };

  it('should render app bar with title and children', () => {
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

    expect(screen.getByText(/PwC One Firm One Day/i)).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show navigation buttons when logged in', () => {
    const store = createMockStore(true);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout><div /></Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should show Admin button only for admin users', () => {
    const store = createMockStore(true, true);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout><div /></Layout>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should navigate when buttons are clicked', () => {
    const store = createMockStore(true);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout><div /></Layout>
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Events'));
    expect(mockNavigate).toHaveBeenCalledWith('/events');

    fireEvent.click(screen.getByText('Calendar'));
    expect(mockNavigate).toHaveBeenCalledWith('/calendar');

    fireEvent.click(screen.getByText('Ideas'));
    expect(mockNavigate).toHaveBeenCalledWith('/ideas');
  });

  it('should dispatch logout when Logout clicked', () => {
    const store = createMockStore(true);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Layout><div /></Layout>
        </BrowserRouter>
      </Provider>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
