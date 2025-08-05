import * as yup from 'yup';

export const registerSchema = yup.object({
  email: yup
    .string()
    .email('Please provide a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .required('Password is required'),
  firstName: yup
    .string()
    .required('First name is required'),
  lastName: yup
    .string()
    .required('Last name is required'),
  department: yup.string().optional(),
  location: yup.string().optional(),
  role: yup
    .string()
    .oneOf(['employee', 'manager', 'admin'])
    .default('employee'),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please provide a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
});

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email('Please provide a valid email address')
    .required('Email is required'),
});

export const resetPasswordSchema = yup.object({
  token: yup
    .string()
    .required('Reset token is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .required('Password is required'),
});