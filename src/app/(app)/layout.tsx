"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/modules/auth/auth-context";
import { supabase } from "@/lib/supabase";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NotificationGate } from "@/components/notification-gate";
import { useFCMSetup } from "@/hooks/use-fcm-setup";
import { ToastProvider } from "@/components/ui/toast";
import { NetworkStatusBanner } from "@/components/network-status-banner";

function AppContent({
    children,
    onMenuPress,
    menuOpen,
    onMenuClose,
}: {
    children: React.ReactNode;
    onMenuPress: () => void;
    menuOpen: boolean;
    onMenuClose: () => void;
}) {
    // Only runs when NotificationGate has confirmed permission === "granted"
    useFCMSetup();

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
                }
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, []);

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
            <NotificationGate>
                <AppContent
                    onMenuPress={() => setMenuOpen(true)}
                    menuOpen={menuOpen}
                    onMenuClose={handleMenuClose}
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
            </NotificationGate>
        </ToastProvider>
    );
}
