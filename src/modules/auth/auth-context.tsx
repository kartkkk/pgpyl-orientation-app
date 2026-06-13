"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useAuthUIStore } from "@/store/auth.store";
import { useAppStore } from "@/store/app.store";
import { useSessionKeepAlive } from "@/hooks/use-session-keepalive";
import { isAdminEmail } from "@/lib/auth-rules";
import type { Profile, UserRole } from "@/types";

const AUTH_TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

function fallbackProfile(userId: string, email: string): Profile {
    const normalizedEmail = email.toLowerCase();
    const fullName = normalizedEmail
        .split("@")[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    return {
        id: userId,
        full_name: fullName || normalizedEmail,
        email: normalizedEmail,
        role: isAdminEmail(normalizedEmail) ? "admin" : "student",
        section_id: null,
        roll_number: null,
        avatar_url: null,
        phone_number: null,
        about_me: null,
        fcm_token: null,
        is_active: true,
        promoted_by: null,
        promoted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole | null;
}

interface AuthContextValue extends AuthState {
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const signingOut = useRef(false);

    useSessionKeepAlive();

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await withTimeout(
            supabase.from("profiles").select("*").eq("id", userId).single(),
            "Profile lookup timed out",
        );
        if (data) setProfile(data as Profile);
        return data as Profile | null;
    }, []);

    const handleSignIn = useCallback(
        async (userId: string, email: string | null | undefined) => {
            if (!email) {
                alert("Your data was not found. Kindly reach out to the O-Week team for assistance.");
                await supabase.auth.signOut();
                setProfile(null);
                window.location.replace("/");
                return null;
            }

            try {
                const existing = await fetchProfile(userId);
                if (existing) return existing;
            } catch (err) {
                console.warn("[Auth] Profile lookup slow, using temporary profile:", err);
                const temporary = fallbackProfile(userId, email);
                setProfile(temporary);
                return temporary;
            }

            alert("Your profile is not ready yet. Kindly reach out to the O-Week team for assistance.");
            await supabase.auth.signOut();
            setProfile(null);
            window.location.replace("/");
            return null;
        },
        [fetchProfile],
    );

    const logout = useCallback(async () => {
        signingOut.current = true;
        try {
            await supabase.auth.signOut();
        } finally {
            queryClient.clear();
            // Clear persisted React Query cache so the next user doesn't see stale data
            if (typeof window !== "undefined") {
                window.localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
            }
            useAuthUIStore.getState().reset();
            useAppStore.getState().reset();
            setProfile(null);
            signingOut.current = false;
            // Full navigation to clear client state and hit the proxy for cookie cleanup
            window.location.replace("/");
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (profile?.id) {
            await fetchProfile(profile.id);
        }
    }, [profile?.id, fetchProfile]);

    // Hydrate from existing session on mount
    useEffect(() => {
        (async () => {
            try {
                const {
                    data: { session },
                } = await withTimeout(
                    supabase.auth.getSession(),
                    "Session lookup timed out",
                );

                if (session?.user) {
                    await handleSignIn(session.user.id, session.user.email);
                }
            } catch (err) {
                console.error("[Auth] Session hydration error:", err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [handleSignIn]);

    // Listen for auth state changes
    useEffect(() => {
        const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (signingOut.current) {
                if (event === "SIGNED_OUT") setProfile(null);
                return;
            }

            switch (event) {
                case "SIGNED_IN": {
                    if (!session?.user) break;
                    await handleSignIn(session.user.id, session.user.email);
                    break;
                }

                case "USER_UPDATED": {
                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    }
                    break;
                }

                case "SIGNED_OUT":
                    setProfile(null);
                    break;

                default:
                    break;
            }
        });
        return () => subscription.subscription.unsubscribe();
    }, [handleSignIn, fetchProfile]);

    const value = useMemo<AuthContextValue>(
        () => ({
            profile,
            isLoading,
            isAuthenticated: !!profile,
            role: profile?.role ?? null,
            logout,
            refreshProfile,
        }),
        [profile, isLoading, logout, refreshProfile],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
