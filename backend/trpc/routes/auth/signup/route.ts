import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { usersDatabase } from '../../../../db/users';

export const signupProcedure = publicProcedure
  .input(
    z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string(),
      role: z.enum(['admin', 'tech', 'homeowner']).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const emailKey = input.email.toLowerCase();

    if (usersDatabase[emailKey]) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role || ('homeowner' as const),
    };

    usersDatabase[emailKey] = {
      password: input.password,
      user: newUser,
      createdAt: new Date().toISOString(),
    };

    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      token,
      user: newUser,
    };
  });
