import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';
import { UserSchema, usersDatabase } from '../../../../db/users';

export const syncUserProcedure = protectedProcedure
  .input(
    z.object({
      user: UserSchema,
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const emailKey = input.user.email.toLowerCase();
    
    usersDatabase[emailKey] = {
      password: input.password,
      user: input.user,
      createdAt: usersDatabase[emailKey]?.createdAt || new Date().toISOString(),
    };

    return { success: true, user: input.user };
  });
