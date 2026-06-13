"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AppLogo } from "@/components/ui/app-logo";
import { supabase } from "@/lib/supabase";
import { APP_NAME } from "@/lib/constants";

type LoginMode = "first" | "returning";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [mode, setMode] = useState<LoginMode>("first");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [passcode, setPasscode] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setLoginError(null);
    setLoginMessage(null);
  };

  const signInWithPassword = async (trimmedEmail: string, credential: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: credential,
    });

    if (signInError) throw signInError;

    void fetch("/api/auth/record-login", { method: "POST" }).catch(() => null);
    window.location.replace("/events");
  };

  const handleFirstLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setLoginError("Enter your ISB email to continue.");
      return;
    }
    if (!passcode) {
      setLoginError("Enter the temporary passcode.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setLoginError("Create a 6-digit PIN.");
      return;
    }
    if (pin !== confirmPin) {
      setLoginError("The PINs do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/setup-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, passcode, pin }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create PIN.");
      }

      setLoginMessage("PIN created. Opening the app...");
      await signInWithPassword(trimmedEmail, pin);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create PIN.";
      setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturningLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setLoginError("Enter your ISB email to continue.");
      return;
    }
    if (!password) {
      setLoginError("Enter your PIN or admin password.");
      return;
    }

    try {
      setIsSubmitting(true);

      try {
        await signInWithPassword(trimmedEmail, password);
        return;
      } catch {
        const response = await fetch("/api/auth/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error ?? "Invalid email or PIN.");
        }

        await signInWithPassword(trimmedEmail, password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or PIN.";
      setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-primary-900 px-6 text-white">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <AppLogo size={64} priority className="mx-auto" />
          <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-sm text-white/70">
            Enter your ISB email to continue
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-white/10 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("first");
              resetMessages();
            }}
            className={`rounded-lg px-3 py-2 transition-colors ${
              mode === "first" ? "bg-white text-primary-700" : "text-white/80"
            }`}
          >
            First login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("returning");
              resetMessages();
            }}
            className={`rounded-lg px-3 py-2 transition-colors ${
              mode === "returning" ? "bg-white text-primary-700" : "text-white/80"
            }`}
          >
            Sign in
          </button>
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

        <form
          onSubmit={mode === "first" ? handleFirstLogin : handleReturningLogin}
          className="space-y-3 text-left"
        >
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/70" htmlFor="email">
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

          {mode === "first" ? (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/70" htmlFor="passcode">
                Temporary passcode
              </label>
              <input
                id="passcode"
                type="password"
                autoComplete="one-time-code"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                placeholder="Temporary passcode"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary-500"
              />

              <label className="block text-xs font-semibold uppercase tracking-wide text-white/70" htmlFor="pin">
                Create 6-digit PIN
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 digits"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary-500"
              />

              <label className="block text-xs font-semibold uppercase tracking-wide text-white/70" htmlFor="confirm-pin">
                Confirm PIN
              </label>
              <input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Repeat PIN"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary-500"
              />
            </>
          ) : (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/70" htmlFor="password">
                PIN / admin password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter PIN or admin password"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary-500"
              />
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-semibold text-white transition-colors active:bg-primary-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              mode === "first" ? "Create PIN & enter" : "Sign in"
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
