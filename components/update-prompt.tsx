"use client";

import { RefreshCw } from "lucide-react";
import { useSwUpdate } from "@/hooks/use-sw-update";

export function UpdatePrompt() {
  const { hasUpdate } = useSwUpdate();

  if (!hasUpdate) return null;

  return (
    <>
      {/* Full-screen blur overlay */}
      <div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-md" />

      {/* Centered modal */}
      <div className="fixed inset-0 z-[80] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 shadow-xl">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-base font-semibold text-foreground">
            App is updating
          </p>
          <p className="text-sm text-muted">This will only take a moment.</p>
        </div>
      </div>
    </>
  );
}
