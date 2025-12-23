// Type definition for User model
export type UserModel = {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'employee' | 'manager' | 'admin';
};