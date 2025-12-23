import authReducer, { login, logout, updateUser } from './authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
  };

  const mockUser = {
    id: 1,
    email: 'test@pwc.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'employee' as const
  };

  const mockToken = 'test-jwt-token';

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle login action', () => {
    const actual = authReducer(initialState, login({ user: mockUser, token: mockToken }));
    expect(actual.user).toEqual(mockUser);
    expect(actual.token).toEqual(mockToken);
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should handle logout action', () => {
    const authenticatedState = {
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
    };

    const actual = authReducer(authenticatedState, logout());
    expect(actual.user).toBeNull();
    expect(actual.token).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });

  it('should handle updateUser action', () => {
    const actual = authReducer(initialState, updateUser(mockUser));
    expect(actual.user).toEqual(mockUser);
    // updateUser doesn't change isAuthenticated, only the user data
    expect(actual.isAuthenticated).toBe(false);
  });

  it('should persist token when updating user', () => {
    const stateWithToken = {
      user: null,
      token: mockToken,
      isAuthenticated: false,
    };

    const actual = authReducer(stateWithToken, updateUser(mockUser));
    expect(actual.token).toEqual(mockToken);
  });

  it('should handle login with admin user', () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    const actual = authReducer(initialState, login({ user: adminUser, token: mockToken }));
    expect(actual.user?.role).toBe('admin');
  });

  it('should clear all state on logout', () => {
    const authenticatedState = {
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
    };

    const actual = authReducer(authenticatedState, logout());
    expect(Object.values(actual).every(val => val === null || val === false)).toBe(true);
  });

  it('should update user when already authenticated', () => {
    const authenticatedState = {
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
    };

    const updatedUserData = { ...mockUser, firstName: 'Updated' };
    const actual = authReducer(authenticatedState, updateUser(updatedUserData));
    expect(actual.user?.firstName).toBe('Updated');
  });

  it('should handle empty login', () => {
    const actual = authReducer(initialState, login({ user: mockUser, token: '' }));
    expect(actual.token).toBe('');
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should maintain state immutability', () => {
    const stateBefore = { ...initialState };
    authReducer(initialState, login({ user: mockUser, token: mockToken }));
    expect(initialState).toEqual(stateBefore);
  });
});
