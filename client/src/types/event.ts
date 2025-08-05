export interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  maxParticipants: number;
  requirements?: string;
  objectives?: string;
  contactEmail?: string;
  contactPhone?: string;
  participants?: Participant[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: number;
  userId: number;
  eventId: number;
  status: 'pending' | 'confirmed' | 'attended';
  feedback?: string;
  attendedAt?: string;
  user: User;
}

export interface User {
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
}
