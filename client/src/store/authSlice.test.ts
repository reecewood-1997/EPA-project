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
    const authenticatedState = {
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
    };

    const updatedUserData = { ...mockUser, firstName: 'Updated' };
    const actual = authReducer(authenticatedState, updateUser(updatedUserData));
    expect(actual.user?.firstName).toBe('Updated');
    expect(actual.token).toEqual(mockToken);
  });
});
