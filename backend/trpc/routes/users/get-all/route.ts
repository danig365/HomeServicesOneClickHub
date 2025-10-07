import { protectedProcedure } from '../../../create-context';
import { usersDatabase } from '../../../../db/users';

export const getAllUsersProcedure = protectedProcedure.query(async () => {
  return Object.values(usersDatabase).map(stored => ({
    ...stored.user,
    createdAt: stored.createdAt,
  }));
});
