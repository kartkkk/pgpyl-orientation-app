"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppLogo } from "@/components/ui/app-logo";
import { useAuth } from "@/modules/auth/auth-context";
import { APP_NAME } from "@/lib/constants";

function LoginContent() {
  const { login, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <AppLogo size={64} priority className="mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="text-sm text-muted">
            Sign in with your ISB email to continue
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-error">
            Sign in failed. Please try again.
          </p>
        )}

        <button
          onClick={login}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-semibold text-white transition-colors active:bg-primary-600 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <MicrosoftIcon />
              Sign in with Microsoft
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
