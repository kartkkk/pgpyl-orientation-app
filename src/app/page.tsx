"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AppLogo } from "@/components/ui/app-logo";
import { useAuth } from "@/modules/auth/auth-context";
import { signInWithEmail } from "@/modules/auth/auth.service";
import { APP_NAME } from "@/lib/constants";

function LoginContent() {
  const { isLoading } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setLoginMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setLoginError("Enter your ISB email to continue.");
      return;
    }

    try {
      setIsSendingLink(true);
      await signInWithEmail(trimmedEmail);
      setLoginMessage("Check your email for the sign-in link.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send the sign-in link.";
      setLoginError(message);
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <AppLogo size={64} priority className="mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="text-sm text-muted">
            Enter your ISB email to continue
          </p>
        </div>

        {(error || loginError) && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-error">
            {loginError ?? "Sign in failed. Please try again."}
          </p>
        )}

        {loginMessage && (
          <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {loginMessage}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-3 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@isb.edu"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary-500"
          />
          <button
            type="submit"
            disabled={isLoading || isSendingLink}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-semibold text-white transition-colors active:bg-primary-600 disabled:opacity-50"
          >
            {isLoading || isSendingLink ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Send sign-in link"
            )}
          </button>
        </form>
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
