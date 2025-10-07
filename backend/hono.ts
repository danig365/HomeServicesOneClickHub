import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use("*", async (c, next) => {
  console.log('[Backend]', c.req.method, c.req.url);
  await next();
  console.log('[Backend] Response status:', c.res.status);
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error('[tRPC Backend] Error on path:', path);
      console.error('[tRPC Backend] Error:', error);
    },
  })
);

app.get("/", (c) => {
  console.log('[Backend] Root endpoint hit');
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  console.log('[Backend] /api endpoint hit');
  return c.json({ status: "ok", message: "Backend API is running" });
});

app.onError((err, c) => {
  console.error('[Backend] Global error:', err);
  return c.json({ error: err.message }, 500);
});

export default app;
