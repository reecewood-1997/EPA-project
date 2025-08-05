import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import eventReducer from './eventSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    event: eventReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
