"use client";

import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw } from "lucide-react";
import { QR_ROTATION_INTERVAL_MS } from "@/lib/constants";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";

interface QRDisplayProps {
    token: string | null;
    code?: string | null;
    isActive: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export function QRDisplay({ token, code, isActive, error, onRetry }: QRDisplayProps) {
    const countdownRef = useRef<HTMLSpanElement>(null);

    // Update the countdown text directly via ref — no state, no re-renders.
    // Resets automatically when `token` changes (new rotation cycle).
    useEffect(() => {
        if (!token) return;

        const start = Date.now();
        const totalSeconds = QR_ROTATION_INTERVAL_MS / 1000;

        const update = () => {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            const remaining = Math.max(0, totalSeconds - elapsed);
            if (countdownRef.current) {
                countdownRef.current.textContent = `Refreshes in ${remaining}s`;
            }
        };

        update();
        const interval = setInterval(update, 1_000);
        return () => clearInterval(interval);
    }, [token]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
                <p className="text-sm font-medium text-error">QR code generation failed</p>
                <p className="max-w-xs text-center text-xs text-muted">{error.message}</p>
                {onRetry && (
                    <Button variant="outline" onClick={onRetry}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                )}
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted">Generating QR code...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-lg">
                <QRCodeSVG value={token} size={240} level="M" bgColor="#ffffff" fgColor="#000000" />
            </div>

            {code && (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted">
                        Or enter code
                    </span>
                    <span className="font-mono text-3xl font-bold tracking-[0.3em] text-primary-600">
                        {code}
                    </span>
                </div>
            )}

            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isActive ? "bg-success animate-pulse" : "bg-muted"}`} />
                <span ref={countdownRef} className="text-sm text-muted">
                    {isActive ? `Refreshes in ${QR_ROTATION_INTERVAL_MS / 1000}s` : "Inactive"}
                </span>
            </div>
        </div>
    );
}
