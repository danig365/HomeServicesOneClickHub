import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';
import { usersDatabase } from '../../../../db/users';

export const updateUserRoleProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      newRole: z.enum(['admin', 'tech', 'homeowner']),
    })
  )
  .mutation(async ({ input }) => {
    const userEntry = Object.entries(usersDatabase).find(
      ([_, stored]) => stored.user.id === input.userId
    );

    if (!userEntry) {
      return { success: false };
    }

    const [emailKey, storedUser] = userEntry;
    usersDatabase[emailKey] = {
      ...storedUser,
      user: {
        ...storedUser.user,
        role: input.newRole,
      },
    };

    return { success: true, user: usersDatabase[emailKey].user };
  });
