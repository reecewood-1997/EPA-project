import * as yup from 'yup';

export const createEventSchema = yup.object({
  title: yup
    .string()
    .min(3, 'Event title must be at least 3 characters long')
    .max(200, 'Event title cannot exceed 200 characters')
    .required('Event title is required'),
  description: yup
    .string()
    .min(10, 'Event description must be at least 10 characters long')
    .max(2000, 'Event description cannot exceed 2000 characters')
    .required('Event description is required'),
  startDate: yup
    .date()
    .min(new Date(), 'Start date must be in the future')
    .required('Start date is required'),
  endDate: yup
    .date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .required('End date is required'),
  location: yup
    .string()
    .min(3, 'Location must be at least 3 characters long')
    .max(300, 'Location cannot exceed 300 characters')
    .required('Location is required'),
  category: yup
    .string()
    .oneOf([
      'environment',
      'education',
      'health',
      'community',
      'elderly-care',
      'youth-support',
      'food-security',
      'homelessness',
      'disability-support',
      'mental-health'
    ], 'Please select a valid category')
    .required('Category is required'),
  maxParticipants: yup
    .number()
    .integer('Maximum participants must be a whole number')
    .min(1, 'Maximum participants must be at least 1')
    .max(500, 'Maximum participants cannot exceed 500')
    .required('Maximum participants is required'),
  requirements: yup
    .string()
    .max(1000, 'Requirements cannot exceed 1000 characters')
    .optional(),
  objectives: yup
    .string()
    .max(1000, 'Objectives cannot exceed 1000 characters')
    .optional(),
  contactEmail: yup
    .string()
    .email('Please provide a valid contact email')
    .required('Contact email is required'),
  contactPhone: yup
    .string()
    .max(20, 'Contact phone cannot exceed 20 characters')
    .optional(),
  tags: yup
    .array()
    .of(yup.string())
    .optional(),
});

export const updateEventSchema = yup.object({
  title: yup
    .string()
    .min(3, 'Event title must be at least 3 characters long')
    .max(200, 'Event title cannot exceed 200 characters')
    .optional(),
  description: yup
    .string()
    .min(10, 'Event description must be at least 10 characters long')
    .max(2000, 'Event description cannot exceed 2000 characters')
    .optional(),
  startDate: yup
    .date()
    .min(new Date(), 'Start date must be in the future')
    .optional(),
  endDate: yup
    .date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .optional(),
  location: yup
    .string()
    .min(3, 'Location must be at least 3 characters long')
    .max(300, 'Location cannot exceed 300 characters')
    .optional(),
  category: yup
    .string()
    .oneOf([
      'environment',
      'education',
      'health',
      'community',
      'elderly-care',
      'youth-support',
      'food-security',
      'homelessness',
      'disability-support',
      'mental-health'
    ], 'Please select a valid category')
    .optional(),
  maxParticipants: yup
    .number()
    .integer('Maximum participants must be a whole number')
    .min(1, 'Maximum participants must be at least 1')
    .max(500, 'Maximum participants cannot exceed 500')
    .optional(),
  requirements: yup
    .string()
    .max(1000, 'Requirements cannot exceed 1000 characters')
    .optional(),
  objectives: yup
    .string()
    .max(1000, 'Objectives cannot exceed 1000 characters')
    .optional(),
  contactEmail: yup
    .string()
    .email('Please provide a valid contact email')
    .optional(),
  contactPhone: yup
    .string()
    .max(20, 'Contact phone cannot exceed 20 characters')
    .optional(),
  tags: yup
    .array()
    .of(yup.string())
    .optional(),
});