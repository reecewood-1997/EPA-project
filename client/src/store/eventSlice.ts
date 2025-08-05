import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Event, Participant } from '../types/event';

interface EventState {
  events: Event[];
  joinedEvents: string[];
}

const initialState: EventState = {
  events: [],
  joinedEvents: [],
};

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    joinEvent: (state, action: PayloadAction<{ eventId: string; userId: string }>) => {
      const event = state.events.find(e => e.id.toString() === action.payload.eventId);
      if (event) {
        if (!event.participants) {
          event.participants = [];
        }
        const newParticipant: Participant = {
          id: Date.now(),
          userId: parseInt(action.payload.userId),
          eventId: event.id,
          status: 'confirmed',
          user: {
            id: parseInt(action.payload.userId),
            email: '',
            firstName: '',
            lastName: '',
            role: ''
          }
        };
        event.participants = [...event.participants, newParticipant];
      }
      if (!state.joinedEvents.includes(action.payload.eventId)) {
        state.joinedEvents.push(action.payload.eventId);
      }
    },
    leaveEvent: (state, action: PayloadAction<{ eventId: string; userId: string }>) => {
      const event = state.events.find(e => e.id.toString() === action.payload.eventId);
      if (event && event.participants) {
        event.participants = event.participants.filter(
          p => p.userId.toString() !== action.payload.userId
        );
      }
      state.joinedEvents = state.joinedEvents.filter(
        (eventId) => eventId !== action.payload.eventId
      );
    },
  },
});

export const { joinEvent, leaveEvent } = eventSlice.actions;
export default eventSlice.reducer;
