import { QueryClient } from "@tanstack/react-query";

const TEN_MINUTES = 1000 * 60 * 10;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: TEN_MINUTES,
      retry: 0,
      networkMode: "always",
    },
    mutations: {
      networkMode: "always",
      retry: 0,
    },
  },
});
