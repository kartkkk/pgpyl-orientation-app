"use client";

import { useState } from "react";
import { CheckCircle, Info, XCircle, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { haptics } from "@/lib/haptics";
import { getScanErrorBody, scanCopy } from "@/lib/ux-copy";
import { useMarkAttendance } from "@/modules/attendance/hooks/useAttendance";

type ScanState =
  | { step: "manual" }
  | { step: "verifying" }
  | { step: "success"; eventTitle: string | null }
  | { step: "already"; eventTitle: string | null }
  | { step: "error"; message: string };

export default function ScanPage() {
  const [scan, setScan] = useState<ScanState>({ step: "manual" });
  const [manualCode, setManualCode] = useState("");
  const markAttendance = useMarkAttendance();

  function handleScan(token: string) {
    console.warn(`[scan] handleScan token=${token.slice(0, 8)}…`);
    setScan({ step: "verifying" });

    markAttendance.mutate(token, {
      onSuccess: (result) => {
        if (result?.already_recorded) {
          haptics.light();
          setScan({
            step: "already",
            eventTitle: result?.event_title ?? null,
          });
        } else {
          haptics.success();
          setScan({
            step: "success",
            eventTitle: result?.event_title ?? null,
          });
        }
      },
      onError: (err) => {
        console.warn("[scan] error:", err);
        haptics.error();
        setScan({ step: "error", message: getScanErrorBody(err) });
      },
    });
  }

  function handleManualSubmit() {
    const code = manualCode.trim();
    if (!/^\d{6}$/.test(code)) return;
    handleScan(code);
  }

  function reset() {
    setManualCode("");
    setScan({ step: "manual" });
  }

  return (
    <>
      <PageHeader title="Attendance Code" showBack />

      <div className="space-y-4 p-4">
        {scan.step === "manual" && (
          <div className="space-y-4">
            <Card className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                <KeyRound className="h-8 w-8 text-primary-500" />
              </div>
              <h2 className="text-base font-semibold">Enter attendance code</h2>
              <p className="text-sm text-muted">
                Type the 6-digit code shown on the presenter&apos;s screen.
              </p>
              <input
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={manualCode}
                onChange={(e) =>
                  setManualCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit();
                }}
                placeholder="••••••"
                className="w-48 rounded-xl border border-border bg-surface-alt px-4 py-3 text-center font-mono text-3xl font-bold tracking-[0.3em] text-foreground outline-none focus:border-primary-500"
              />
            </Card>
            <Button onClick={handleManualSubmit} disabled={manualCode.length !== 6}>
              Submit code
            </Button>
          </div>
        )}

        {scan.step === "verifying" && (
          <Card className="flex flex-col items-center gap-4 py-8 text-center">
            <LoadingSpinner size="lg" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold">
                {scanCopy.verifyingTitle}
              </h2>
              <p className="text-sm text-muted">{scanCopy.verifyingBody}</p>
            </div>
          </Card>
        )}

        {scan.step === "success" && (
          <Card className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-success">
                {scanCopy.successTitle}
              </h2>
              {scan.eventTitle && (
                <p className="text-sm font-medium text-foreground">
                  {scan.eventTitle}
                </p>
              )}
              <p className="text-xs text-muted">{scanCopy.successBody}</p>
            </div>
            <Button variant="outline" onClick={reset} fullWidth={false}>
              Scan Again
            </Button>
          </Card>
        )}

        {scan.step === "already" && (
          <Card className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <Info className="h-8 w-8 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-amber-600">
                Already checked in
              </h2>
              {scan.eventTitle && (
                <p className="text-sm font-medium text-foreground">
                  {scan.eventTitle}
                </p>
              )}
              <p className="text-xs text-muted">
                Your attendance was already marked for this session.
              </p>
            </div>
            <Button variant="outline" onClick={reset} fullWidth={false}>
              Done
            </Button>
          </Card>
        )}

        {scan.step === "error" && (
          <Card className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-8 w-8 text-error" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-error">
                {scanCopy.errorTitle}
              </h2>
              <p className="text-xs text-muted">{scan.message}</p>
            </div>
            <Button variant="outline" onClick={reset} fullWidth={false}>
              Try Again
            </Button>
          </Card>
        )}
      </div>
    </>
  );
}
