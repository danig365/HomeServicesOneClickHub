import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { loginProcedure } from "./routes/auth/login/route";
import { signupProcedure } from "./routes/auth/signup/route";
import { syncUserProcedure } from "./routes/users/sync/route";
import { getAllUsersProcedure } from "./routes/users/get-all/route";
import { deleteUserProcedure } from "./routes/users/delete/route";
import { updateUserRoleProcedure } from "./routes/users/update-role/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    login: loginProcedure,
    signup: signupProcedure,
  }),
  users: createTRPCRouter({
    sync: syncUserProcedure,
    getAll: getAllUsersProcedure,
    delete: deleteUserProcedure,
    updateRole: updateUserRoleProcedure,
  }),
});

export type AppRouter = typeof appRouter;
