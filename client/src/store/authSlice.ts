import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    location?: string;
    interests?: string[];
    profilePicture?: string;
    bio?: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getStoredUser = () => {
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token') && !!getStoredUser(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
