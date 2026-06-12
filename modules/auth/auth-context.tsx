"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useAuthUIStore } from "@/store/auth.store";
import { useAppStore } from "@/store/app.store";
import { useSessionKeepAlive } from "@/hooks/use-session-keepalive";
import { signInWithMicrosoft } from "./auth.service";
import type { Profile, UserRole } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole | null;
}

interface AuthContextValue extends AuthState {
    login: () => Promise<void>;
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
        const { data } = await supabase.from("profiles").select("*, section:sections(*)").eq("id", userId).single();
        if (data) setProfile(data as Profile);
        return data as Profile | null;
    }, []);

    const verifyRegistryEntry = useCallback(async (email: string) => {
        const normalizedEmail = email.toLowerCase();
        const { data } = await supabase
            .from("student_registry")
            .select("email")
            .eq("email", normalizedEmail)
            .maybeSingle();

        return Boolean(data);
    }, []);

    const isAdminEmail = useCallback((email: string) => /_pgp2026@isb\.edu$/i.test(email), []);

    const handleSignIn = useCallback(
        async (userId: string, email: string | null | undefined) => {
            if (!email) {
                alert("Your data was not found. Kindly reach out to the O-Week team for assistance.");
                await supabase.auth.signOut();
                setProfile(null);
                window.location.replace("/");
                return null;
            }

            if (!isAdminEmail(email)) {
                const isWhitelisted = await verifyRegistryEntry(email);
                if (!isWhitelisted) {
                    alert("Your data was not found. Kindly reach out to the O-Week team for assistance.");
                    await supabase.auth.signOut();
                    setProfile(null);
                    window.location.replace("/");
                    return null;
                }
            }

            const existing = await fetchProfile(userId);
            if (existing) return existing;

            alert("Your data was not found. Kindly reach out to the O-Week team for assistance.");
            await supabase.auth.signOut();
            setProfile(null);
            window.location.replace("/");
            return null;
        },
        [fetchProfile, isAdminEmail, verifyRegistryEntry],
    );

    const login = useCallback(async () => {
        await signInWithMicrosoft();
        // Full-page redirect — control returns via /auth/callback
    }, []);

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
                } = await supabase.auth.getSession();

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
            login,
            logout,
            refreshProfile,
        }),
        [profile, isLoading, login, logout, refreshProfile],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
