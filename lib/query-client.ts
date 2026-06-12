import { QueryClient } from "@tanstack/react-query";

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: TWENTY_FOUR_HOURS,
      retry: 2,
      networkMode: "always",
    },
    mutations: {
      networkMode: "always", // Don't pause mutations based on online status — no offline sync
      retry: 1, // Retry transient network failures once
    },
  },
});
