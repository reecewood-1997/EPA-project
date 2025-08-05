import { useState, useEffect } from 'react';
import axios from 'axios';
import { Event } from '../types/event';

// Mock data for testing without backend
const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Community Garden Cleanup',
    description: 'Help maintain and beautify our local community garden. We\'ll be weeding, planting, and general maintenance.',
    startDate: '2024-12-15T09:00:00',
    endDate: '2024-12-15T12:00:00',
    location: 'London Community Garden, Camden',
    category: 'environment',
    maxParticipants: 15,
    requirements: 'No experience needed, gardening gloves provided',
    objectives: 'Improve local green spaces and build community connections',
    contactEmail: 'garden@pwc.com',
    contactPhone: '+44 20 7123 4567',
    participants: [
      {
        id: 1,
        userId: 2,
        eventId: 1,
        status: 'confirmed',
        user: {
          id: 2,
          email: 'jane.smith@pwc.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'Senior Associate'
        }
      }
    ],
    createdBy: {
      id: 3,
      email: 'organizer@pwc.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'Manager'
    },
    createdAt: '2024-12-01T10:00:00',
    updatedAt: '2024-12-01T10:00:00'
  },
  {
    id: 2,
    title: 'Tech Skills Workshop for Seniors',
    description: 'Teach basic computer and smartphone skills to elderly residents at the local community center.',
    startDate: '2024-12-18T14:00:00',
    endDate: '2024-12-18T17:00:00',
    location: 'Manchester Community Center',
    category: 'education',
    maxParticipants: 8,
    requirements: 'Basic tech knowledge, patience, and good communication skills',
    objectives: 'Bridge the digital divide and support elderly community members',
    contactEmail: 'tech@pwc.com',
    participants: [],
    createdBy: {
      id: 4,
      email: 'techvolunteer@pwc.com',
      firstName: 'Bob',
      lastName: 'Wilson',
      role: 'Technology Consultant'
    },
    createdAt: '2024-12-02T14:30:00',
    updatedAt: '2024-12-02T14:30:00'
  },
  {
    id: 3,
    title: 'Food Bank Sorting and Packing',
    description: 'Sort donations and pack food parcels for families in need during the holiday season.',
    startDate: '2024-12-20T10:00:00',
    endDate: '2024-12-20T15:00:00',
    location: 'Birmingham Food Bank Warehouse',
    category: 'food-security',
    maxParticipants: 20,
    requirements: 'Comfortable standing for extended periods',
    objectives: 'Support food security initiatives and help families during the holidays',
    contactEmail: 'foodbank@pwc.com',
    participants: [
      {
        id: 2,
        userId: 1,
        eventId: 3,
        status: 'pending',
        user: {
          id: 1,
          email: 'john.doe@pwc.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'Employee'
        }
      }
    ],
    createdBy: {
      id: 5,
      email: 'community@pwc.com',
      firstName: 'Sarah',
      lastName: 'Davis',
      role: 'Community Liaison'
    },
    createdAt: '2024-12-03T09:15:00',
    updatedAt: '2024-12-03T09:15:00'
  }
];

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Try to fetch from backend first, fall back to mock data
        try {
          const response = await axios.get('http://localhost:5000/api/events');
          if (response.data.success && response.data.data) {
            setEvents(response.data.data.events || response.data.data);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (backendError) {
          // Backend not available, use mock data + locally created events
          console.log('Backend not available, using mock data');
          const localEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
          const allEvents = [...mockEvents, ...localEvents];
          setEvents(allEvents);
        }
      } catch (err) {
        setError('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};
