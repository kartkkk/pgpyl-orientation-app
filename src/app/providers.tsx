"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/modules/auth/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  // Ensure stable queryClient reference across renders
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
