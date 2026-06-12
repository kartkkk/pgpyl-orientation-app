"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { APP_NAME } from "@/lib/constants";

type Platform = "ios" | "android" | "other";

// ---- Capability + platform detection --------------------------------------

function canUseNotifications(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
}

function detectPlatform(): Platform {
    if (typeof navigator === "undefined") return "other";
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "other";
}

/**
 * iOS PWA quirk: `Notification.permission` returns "denied" by default even
 * before the user has ever been prompted. This is different from desktop
 * browsers where the initial state is "default". We track whether the user has
 * ever been prompted so we can distinguish "never prompted" from "actually denied".
 */
const PROMPTED_KEY = "notification_prompted";

function hasBeenPrompted(): boolean {
    try {
        return localStorage.getItem(PROMPTED_KEY) === "1";
    } catch {
        return false;
    }
}

function markPrompted() {
    try {
        localStorage.setItem(PROMPTED_KEY, "1");
    } catch {
        // ignore
    }
}

function getPermission(): NotificationPermission {
    if (!canUseNotifications()) return "granted";

    const perm = Notification.permission;

    // On iOS, permission starts as "denied" even before the user was ever asked.
    // Treat "denied" as "default" (promptable) if the user has never been prompted.
    if (perm === "denied" && !hasBeenPrompted()) {
        return "default";
    }

    return perm;
}

// ---- Permission state store bridge (useSyncExternalStore) -----------------

// Listeners that want to be notified when permission changes.
const permissionListeners = new Set<() => void>();

function notifyPermissionChange() {
    permissionListeners.forEach((cb) => cb());
    // Broadcast so other hooks (useFCMSetup) can react — navigator.permissions.query
    // doesn't work on iOS, so we use a custom DOM event instead.
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notification-permission-change"));
    }
}

/**
 * Subscribe to permission changes. Only listens for visibilitychange — removed
 * focus/pageshow listeners that fired on every tab switch and caused the gate
 * to re-evaluate (and block navigation) too frequently.
 */
function subscribePermission(cb: () => void) {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return () => {};
    }

    permissionListeners.add(cb);

    const handler = () => {
        if (document.visibilityState === "visible") cb();
    };

    document.addEventListener("visibilitychange", handler);

    return () => {
        permissionListeners.delete(cb);
        document.removeEventListener("visibilitychange", handler);
    };
}

function getServerPermission() {
    return "default" as NotificationPermission;
}

export function NotificationGate({ children }: { children: React.ReactNode }) {
    // Keep permission/platform derivation in sync without local state churn.
    const permission = useSyncExternalStore(subscribePermission, getPermission, getServerPermission);
    const platform = useSyncExternalStore(
        () => () => {},
        detectPlatform,
        () => "other" as Platform,
    );

    if (permission === null) return null;

    // Always render children — overlay the prompt on top when not granted.
    // This prevents the entire app tree from being unmounted/remounted on
    // every permission re-check, which was the main cause of navigation lag.
    return (
        <>
            {children}
            {permission !== "granted" && (
                <div className="fixed inset-0 z-[100] bg-white">
                    <NotificationPromptScreen
                        permission={permission}
                        platform={platform}
                        onPermissionChange={notifyPermissionChange}
                    />
                </div>
            )}
        </>
    );
}

// ── Fullscreen blocking screen ──────────────────────────────────────────────

interface PromptScreenProps {
    permission: NotificationPermission;
    platform: Platform;
    onPermissionChange: () => void;
}

function NotificationPromptScreen({ permission, platform, onPermissionChange }: PromptScreenProps) {
    const [requesting, setRequesting] = useState(false);
    const [showManualSteps, setShowManualSteps] = useState(false);
    const [lastAttemptDenied, setLastAttemptDenied] = useState(false);

    const handleRequestPermission = async () => {
        if (!canUseNotifications() || requesting) {
            onPermissionChange();
            return;
        }

        setRequesting(true);
        setLastAttemptDenied(false);

        try {
            // Mark this attempt so iOS "denied-by-default" can be interpreted correctly.
            markPrompted();

            const result = await Notification.requestPermission();

            if (result === "granted") {
                haptics.success();
            } else {
                haptics.error();
                setLastAttemptDenied(true);
                setShowManualSteps(true);
            }

            onPermissionChange();
        } catch {
            haptics.error();
            setLastAttemptDenied(true);
            setShowManualSteps(true);
            onPermissionChange();
        } finally {
            setRequesting(false);
        }
    };

    const isDenied = permission === "denied";
    const shouldShowManualSteps = isDenied || showManualSteps;

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm space-y-6 text-center">
                {/* Branding */}
                <div className="space-y-2">
                    <AppLogo size={64} priority className="mx-auto" />
                    <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
                    <p className="text-sm text-muted">Enable notifications to continue</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-border bg-white p-6 text-left shadow-sm">
                    <div className="space-y-5">
                        <div className="rounded-xl border border-primary-100 bg-primary-50 p-3">
                            <div className="flex items-start gap-2.5">
                                <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                                <p className="text-xs font-medium text-primary-900">
                                    Real-time alerts help you catch attendance windows, event changes, and group updates on time.
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-muted">
                            Stay updated with event alerts, group invites, and important announcements. Notifications
                            are required to use {APP_NAME}.
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />
                                Event reminders and updates
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />
                                Group announcements and invites
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />
                                Deadline and attendance cues
                            </div>
                        </div>

                        {lastAttemptDenied && (
                            <div className="rounded-xl bg-amber-50 px-4 py-3">
                                <div className="flex items-start gap-2">
                                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                                    <p className="text-xs font-medium text-amber-800">
                                        Notifications are still blocked. Enable them in settings, then tap the button below to re-check.
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button onClick={handleRequestPermission} loading={requesting}>
                            {requesting ? "Requesting..." : "Enable Notifications"}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                haptics.light();
                                onPermissionChange();
                                setShowManualSteps(true);
                            }}
                        >
                            I Enabled It, Re-check
                        </Button>

                        <p className="text-center text-[11px] text-muted">
                            A browser permission prompt appears after tapping enable.
                        </p>

                        {shouldShowManualSteps && (
                            <DeniedInstructions
                                platform={platform}
                                onRecheck={() => {
                                    haptics.light();
                                    onPermissionChange();
                                }}
                            />
                        )}

                        {requesting && (
                            <div className="flex items-center justify-center gap-2 text-xs text-muted">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Waiting for permission response...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Platform-specific instructions when permission is denied ────────────────

function DeniedInstructions({
    platform,
    onRecheck,
}: {
    platform: Platform;
    onRecheck: () => void;
}) {
    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium text-amber-800">
                    Notifications were previously blocked. Enable them manually in settings, then return here.
                </p>
            </div>

            {platform === "ios" ? (
                <ol className="list-inside list-decimal space-y-3 text-sm text-muted">
                    <li>
                        Open <strong className="text-foreground">Settings</strong> on your device
                    </li>
                    <li>
                        Go to <strong className="text-foreground">Notifications</strong>
                    </li>
                    <li>
                        Find <strong className="text-foreground">{APP_NAME}</strong> and enable
                        <strong className="text-foreground"> Allow Notifications</strong>
                    </li>
                    <li>Return to this app</li>
                </ol>
            ) : (
                <ol className="list-inside list-decimal space-y-3 text-sm text-muted">
                    <li>
                        Open the app details/site settings from browser menu
                    </li>
                    <li>
                        Go to <strong className="text-foreground">Notifications</strong>
                    </li>
                    <li>
                        Change permission to <strong className="text-foreground">Allow</strong>
                    </li>
                    <li>Return to this app</li>
                </ol>
            )}

            <Button variant="outline" onClick={onRecheck}>
                Re-check Permission
            </Button>

            <p className="text-center text-xs text-muted">
                The app will detect the change automatically when you return.
            </p>
        </div>
    );
}
