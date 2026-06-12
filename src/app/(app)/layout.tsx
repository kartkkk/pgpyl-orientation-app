"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/auth-context";
import { supabase } from "@/lib/supabase";
import { contactsQueryOptions } from "@/modules/contacts/hooks/useContacts";
import { prefetchStudents } from "@/modules/students/hooks/useStudents";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ToastProvider } from "@/components/ui/toast";
import { NetworkStatusBanner } from "@/components/network-status-banner";

const PREFETCH_KICKOFF_DELAY_MS = 1200;
const PREFETCH_IDLE_TIMEOUT_MS = 5000;
const PREFETCH_FALLBACK_DELAY_MS = 2000;

type IdleAwareWindow = Window & {
    requestIdleCallback?: (
        callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
        options?: { timeout: number },
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
};

function AppContent({
    children,
    onMenuPress,
    menuOpen,
    onMenuClose,
    isAuthenticated,
    isLoading,
}: {
    children: React.ReactNode;
    onMenuPress: () => void;
    menuOpen: boolean;
    onMenuClose: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}) {
    const queryClient = useQueryClient();

    // Request persistent storage to prevent iOS 7-day cache eviction
    useEffect(() => {
        navigator.storage?.persist?.();
    }, []);

    // Invalidate all active query caches when the app resumes from background
    // after a meaningful period. Refreshes the session first so queries use a
    // valid JWT (avoids the infinite-RefreshBar race condition).
    useEffect(() => {
        let hiddenAt: number | null = null;
        const STALE_THRESHOLD_MS = 5_000;

        const onVisibilityChange = async () => {
            if (document.visibilityState === "hidden") {
                hiddenAt = Date.now();
            } else if (document.visibilityState === "visible" && hiddenAt !== null) {
                const elapsed = Date.now() - hiddenAt;
                hiddenAt = null;
                if (elapsed > STALE_THRESHOLD_MS) {
                    await supabase.auth.refreshSession();
                    queryClient.invalidateQueries({ type: "active" });
                }
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, [queryClient]);

    // Warm static catalogs in low-priority idle time after higher-priority startup flows.
    useEffect(() => {
        if (!isAuthenticated || isLoading) {
            return;
        }

        let cancelled = false;
        let kickoffTimer: number | null = null;
        let fallbackTimer: number | null = null;
        let idleHandle: number | null = null;

        const warmCatalog = () => {
            if (cancelled) {
                return;
            }

            // High-priority prefetches first
            void Promise.allSettled([
                queryClient.prefetchQuery(contactsQueryOptions),
            ]).then(() => {
                // Low-priority: students directory
                if (!cancelled) {
                    void prefetchStudents(queryClient);
                }
            });
        };

        const idleWindow = window as IdleAwareWindow;

        kickoffTimer = idleWindow.setTimeout(() => {
            if (typeof idleWindow.requestIdleCallback === "function") {
                idleHandle = idleWindow.requestIdleCallback(() => warmCatalog(), {
                    timeout: PREFETCH_IDLE_TIMEOUT_MS,
                });
                return;
            }

            fallbackTimer = idleWindow.setTimeout(warmCatalog, PREFETCH_FALLBACK_DELAY_MS);
        }, PREFETCH_KICKOFF_DELAY_MS);

        return () => {
            cancelled = true;

            if (kickoffTimer !== null) {
                idleWindow.clearTimeout(kickoffTimer);
            }

            if (fallbackTimer !== null) {
                idleWindow.clearTimeout(fallbackTimer);
            }

            if (idleHandle !== null && typeof idleWindow.cancelIdleCallback === "function") {
                idleWindow.cancelIdleCallback(idleHandle);
            }
        };
    }, [isAuthenticated, isLoading, queryClient]);

    return (
        <div className="flex min-h-dvh flex-col pb-14">
            <NetworkStatusBanner />
            <main className="flex-1">{children}</main>
            <BottomNav onMenuPress={onMenuPress} />
            <MobileMenu isOpen={menuOpen} onClose={onMenuClose} />
        </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { isLoading, isAuthenticated } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleMenuClose = useCallback(() => setMenuOpen(false), []);

    if (!isAuthenticated && !isLoading) {
        return null; // logout() handles the redirect
    }

    return (
        <ToastProvider>
            <AppContent
                onMenuPress={() => setMenuOpen(true)}
                menuOpen={menuOpen}
                onMenuClose={handleMenuClose}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
            >
                {isLoading ? (
                    <div className="flex min-h-[60dvh] items-center justify-center">
                        <span
                            className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary-500 border-t-transparent"
                            aria-label="Loading"
                        />
                    </div>
                ) : (
                    children
                )}
            </AppContent>
        </ToastProvider>
    );
}
