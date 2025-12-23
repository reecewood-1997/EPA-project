import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from './ProtectedRoute';
import authReducer from '../store/authSlice';

describe('ProtectedRoute Component', () => {
  const createMockStore = (isAuthenticated: boolean, user: any = null) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user,
          token: isAuthenticated ? 'test-token' : null,
          isAuthenticated,
          loading: false,
          error: null,
        },
      },
    });
  };

  it('should render children when user is authenticated', () => {
    const store = createMockStore(true, {
      id: 1,
      email: 'test@pwc.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to /login when user is not authenticated', () => {
    const store = createMockStore(false);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should not render protected content when authentication state is false', () => {
    const store = createMockStore(false);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should allow access to protected route with valid authentication', () => {
    const store = createMockStore(true, {
      id: 2,
      email: 'admin@pwc.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute>
            <div data-testid="admin-panel">Admin Panel</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
  });
});
