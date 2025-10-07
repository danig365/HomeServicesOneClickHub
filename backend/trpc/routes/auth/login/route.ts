import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { usersDatabase } from '../../../../db/users';

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const userRecord = usersDatabase[input.email.toLowerCase()];

    if (!userRecord || userRecord.password !== input.password) {
      throw new Error('Invalid email or password');
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      token,
      user: userRecord.user,
    };
  });
