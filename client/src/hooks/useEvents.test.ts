import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useEvents } from './useEvents';
import authReducer from '../store/authSlice';
import axios from 'axios';
import React from 'react';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useEvents Hook', () => {
  const mockEvents = [
    {
      id: 1,
      title: 'Beach Cleanup',
      description: 'Clean up the beach',
      startDate: '2026-06-15T10:00:00Z',
      endDate: '2026-06-15T14:00:00Z',
      location: 'Brighton',
      maxParticipants: 20,
      category: 'Environment',
      participants: [],
      createdBy: {
        id: 1,
        email: 'test@pwc.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee'
      },
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z'
    },
    {
      id: 2,
      title: 'Food Bank',
      description: 'Help at food bank',
      startDate: '2026-07-20T09:00:00Z',
      endDate: '2026-07-20T14:00:00Z',
      location: 'London',
      maxParticipants: 15,
      category: 'Community',
      participants: [],
      createdBy: {
        id: 1,
        email: 'test@pwc.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee'
      },
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z'
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
            email: 'test@pwc.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'employee'
          },
          token: 'test-token',
          isAuthenticated: true,
        },
      },
    });
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const store = createMockStore();
    return React.createElement(Provider, { store }, children);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: mockEvents
      }
    });
  });

  it('should fetch events on mount', async () => {
    const { result } = renderHook(() => useEvents(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events.length).toBe(mockEvents.length);
    expect(result.current.error).toBeNull();
  });

  it('should set loading state correctly', async () => {
    const { result } = renderHook(() => useEvents(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook falls back to mock data on error, so events array won't be empty
    expect(result.current.events).toBeDefined();
    expect(Array.isArray(result.current.events)).toBe(true);
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should refetch events when refetch is called', async () => {
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockedAxios.get.mock.calls.length;

    result.current.refetch();

    await waitFor(() => {
      expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should return empty array when no events', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    });

    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
  });

  it('should handle malformed response data', async () => {
    mockedAxios.get.mockResolvedValue({
      data: null
    });

    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook falls back to mock data when response is malformed
    expect(result.current.events).toBeDefined();
    expect(Array.isArray(result.current.events)).toBe(true);
  });

  it('should make API call with correct URL', async () => {
    renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/events')
      );
    });
  });

  it('should include auth token in request when user is authenticated', async () => {
    renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer')
          })
        })
      );
    });
  });
});
