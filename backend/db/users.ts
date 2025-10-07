import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.enum(['admin', 'tech', 'homeowner']),
  photo: z.string().optional(),
  assignedProperties: z.array(z.string()).optional(),
});

export const StoredUserSchema = z.object({
  password: z.string(),
  user: UserSchema,
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type StoredUser = z.infer<typeof StoredUserSchema>;

export const usersDatabase: Record<string, StoredUser> = {
  'admin@hudson.com': {
    password: 'admin123',
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@hudson.com',
      phone: '(555) 999-9999',
      role: 'admin',
    },
    createdAt: new Date().toISOString(),
  },
  'tech@hudson.com': {
    password: 'tech123',
    user: {
      id: 'tech-1',
      name: 'John Smith',
      email: 'tech@hudson.com',
      phone: '(555) 123-4567',
      role: 'tech',
      assignedProperties: ['1'],
    },
    createdAt: new Date().toISOString(),
  },
  'homeowner@hudson.com': {
    password: 'home123',
    user: {
      id: 'homeowner-1',
      name: 'Jane Doe',
      email: 'homeowner@hudson.com',
      phone: '(555) 555-5555',
      role: 'homeowner',
    },
    createdAt: new Date().toISOString(),
  },
};
