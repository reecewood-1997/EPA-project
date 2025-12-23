// Type definition for EventParticipant model
export type EventParticipantModel = {
  id?: number;
  userId?: number;
  eventId?: number;
  status?: 'pending' | 'confirmed' | 'attended' | 'cancelled';
};