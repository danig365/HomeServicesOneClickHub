import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    console.log('[tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', url);
    return url;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      console.log('[tRPC] Using window.location.origin:', origin);
      return origin;
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
        console.log('[tRPC React] Fetching:', url);
        console.log('[tRPC React] Platform:', Platform.OS);
        console.log('[tRPC React] Base URL:', getBaseUrl());
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log('[tRPC React] Request timeout after 15s');
            controller.abort();
          }, 15000);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          console.log('[tRPC React] Response status:', response.status);
          return response;
        } catch (error) {
          console.error('[tRPC React] Fetch error:', error);
          if (error instanceof Error) {
            console.error('[tRPC React] Error details:', {
              name: error.name,
              message: error.message,
              platform: Platform.OS,
              url: url,
              baseUrl: getBaseUrl(),
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
        console.log('[tRPC Client] Fetching:', url);
        console.log('[tRPC Client] Platform:', Platform.OS);
        console.log('[tRPC Client] Base URL:', getBaseUrl());
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log('[tRPC Client] Request timeout after 15s');
            controller.abort();
          }, 15000);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          console.log('[tRPC Client] Response status:', response.status);
          return response;
        } catch (error) {
          console.error('[tRPC Client] Fetch error:', error);
          if (error instanceof Error) {
            console.error('[tRPC Client] Error details:', {
              name: error.name,
              message: error.message,
              platform: Platform.OS,
              url: url,
              baseUrl: getBaseUrl(),
            });
          }
          throw error;
        }
      },
    }),
  ],
});
