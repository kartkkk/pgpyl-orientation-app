"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/modules/auth/auth-context";

const persister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({ storage: window.localStorage })
    : undefined;

export function Providers({ children }: { children: React.ReactNode }) {
  // Ensure stable queryClient reference across renders
  const [client] = useState(() => queryClient);

  if (persister) {
    return (
      <PersistQueryClientProvider
        client={client}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: "v3" }}
      >
        <AuthProvider>{children}</AuthProvider>
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
