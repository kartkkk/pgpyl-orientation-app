"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <span className="text-2xl">!</span>
      </div>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-medium text-white active:bg-primary-600"
      >
        Try again
      </button>
    </div>
  );
}
