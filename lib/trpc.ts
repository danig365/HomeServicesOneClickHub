import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('[tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      console.log('[tRPC] Using window.location.origin:', window.location.origin);
      return window.location.origin;
    }
    console.log('[tRPC] Using fallback localhost:8081');
    return "http://localhost:8081";
  }

  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    const url = `http://${host}:8081`;
    console.log('[tRPC] Using debugger host:', url, 'from hostUri:', debuggerHost);
    return url;
  }

  console.log('[tRPC] WARNING: Could not determine host. Using localhost:8081');
  console.log('[tRPC] For mobile devices, set EXPO_PUBLIC_RORK_API_BASE_URL to your computer\'s IP');
  return "http://localhost:8081";
}

export const trpcReactClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('[tRPC] Fetching:', url);
        console.log('[tRPC] Platform:', Platform.OS);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log('[tRPC] Request timeout after 10s');
            controller.abort();
          }, 10000);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          console.log('[tRPC] Response status:', response.status);
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch error:', error);
          if (error instanceof Error) {
            console.error('[tRPC] Error details:', {
              name: error.name,
              message: error.message,
              platform: Platform.OS,
              url: url,
            });
          }
          throw error;
        }
      },
    }),
  ],
});

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('[tRPC] Fetching:', url);
        console.log('[tRPC] Platform:', Platform.OS);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log('[tRPC] Request timeout after 10s');
            controller.abort();
          }, 10000);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          console.log('[tRPC] Response status:', response.status);
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch error:', error);
          if (error instanceof Error) {
            console.error('[tRPC] Error details:', {
              name: error.name,
              message: error.message,
              platform: Platform.OS,
              url: url,
            });
          }
          throw error;
        }
      },
    }),
  ],
});
