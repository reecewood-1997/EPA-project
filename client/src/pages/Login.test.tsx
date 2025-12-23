import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Login from './Login';
import authReducer from '../store/authSlice';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Login Page', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render login form by default', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should switch to register mode when register button is clicked', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    const registerButton = screen.getByRole('button', { name: /Need an account\? Register/i });
    fireEvent.click(registerButton);

    expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    // Department field is a Select component, just verify we're in register mode
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('should switch back to login mode from register mode', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    // Switch to register mode
    const registerButton = screen.getByRole('button', { name: /Need an account\? Register/i });
    fireEvent.click(registerButton);

    // Switch back to login mode
    const loginButton = screen.getByRole('button', { name: /Already have an account\? Sign In/i });
    fireEvent.click(loginButton);

    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/First Name/i)).not.toBeInTheDocument();
  });

  it('should show password requirements when password field is focused in register mode', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    // Switch to register mode
    const registerButton = screen.getByRole('button', { name: /Need an account\? Register/i });
    fireEvent.click(registerButton);

    // Focus on password field
    const passwordField = screen.getByLabelText(/Password/i);
    fireEvent.focus(passwordField);

    await waitFor(() => {
      expect(screen.getByText(/Password Requirements:/i)).toBeInTheDocument();
      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/One uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/One lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/One number/i)).toBeInTheDocument();
      expect(screen.getByText(/One special character/i)).toBeInTheDocument();
    });
  });

  it('should validate password requirements correctly', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    // Switch to register mode
    const registerButton = screen.getByRole('button', { name: /Need an account\? Register/i });
    fireEvent.click(registerButton);

    const passwordField = screen.getByLabelText(/Password/i);
    fireEvent.focus(passwordField);

    // Type a valid password
    fireEvent.change(passwordField, { target: { value: 'ValidPass123!' } });

    await waitFor(() => {
      const requirements = screen.getAllByText(/✓/);
      expect(requirements.length).toBe(5); // All 5 requirements should be met
    });
  });

  it('should successfully login with valid credentials', async () => {
    const store = createMockStore();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@pwc.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'employee',
          },
          token: 'test-token-123',
        },
      }),
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    const emailField = screen.getByLabelText(/Email/i);
    const passwordField = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailField, { target: { value: 'test@pwc.com' } });
    fireEvent.change(passwordField, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });
  });

  it('should show error message on failed login', async () => {
    const store = createMockStore();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Invalid credentials',
      }),
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    const emailField = screen.getByLabelText(/Email/i);
    const passwordField = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailField, { target: { value: 'test@pwc.com' } });
    fireEvent.change(passwordField, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('should successfully register with valid information', async () => {
    const store = createMockStore();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: 2,
            email: 'newuser@pwc.com',
            firstName: 'New',
            lastName: 'User',
            role: 'employee',
          },
          token: 'new-token-123',
        },
      }),
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    // Switch to register mode
    const registerButton = screen.getByRole('button', { name: /Need an account\? Register/i });
    fireEvent.click(registerButton);

    // Fill in registration form
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'newuser@pwc.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'ValidPass123!' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'London' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/auth/register',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });
  });

  it('should prevent registration with invalid password', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    // Switch to register mode
    const registerButton = screen.getByRole('button', { name: /Need an account\? Register/i });
    fireEvent.click(registerButton);

    // Fill in form with invalid password
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'newuser@pwc.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'weak' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please ensure your password meets all requirements/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('should disable submit button while loading', async () => {
    const store = createMockStore();

    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true, data: { user: {}, token: 'token' } }),
              }),
            100
          )
        )
    );

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    const emailField = screen.getByLabelText(/Email/i);
    const passwordField = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailField, { target: { value: 'test@pwc.com' } });
    fireEvent.change(passwordField, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Button should be disabled while loading
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /Signing in.../i })).toBeDisabled();
  });

  it('should show server connection error when fetch fails', async () => {
    const store = createMockStore();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    const emailField = screen.getByLabelText(/Email/i);
    const passwordField = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailField, { target: { value: 'test@pwc.com' } });
    fireEvent.change(passwordField, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Unable to connect to server/i)).toBeInTheDocument();
    });
  });

  it('should show demo message', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Demo: Use any email and password to sign in/i)).toBeInTheDocument();
  });
});
