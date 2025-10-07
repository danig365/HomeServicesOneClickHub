import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';
import { usersDatabase } from '../../../../db/users';

export const deleteUserProcedure = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(async ({ input }) => {
    const userToDelete = Object.entries(usersDatabase).find(
      ([_, stored]) => stored.user.id === input.userId
    );

    if (!userToDelete) {
      return { success: false };
    }

    const [emailKey] = userToDelete;
    delete usersDatabase[emailKey];

    return { success: true };
  });
