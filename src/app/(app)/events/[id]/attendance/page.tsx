"use client";

import { use, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { QRDisplay } from "@/modules/attendance/components/qr-display";
import { useEvent } from "@/modules/events/hooks/useEvents";
import {
  useAttendanceSession,
  useOpenSession,
  useCloseSession,
  useExportAttendance,
} from "@/modules/attendance/hooks/useAttendance";
import { useQRRotation } from "@/modules/attendance/hooks/useQRRotation";
import { useAuth } from "@/modules/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/lib/haptics";

export default function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // use() must be the very first hook — it can suspend, and React requires
  // hooks to run in the same order on every render.
  const { id: eventId } = use(params);
  return <AttendancePageInner eventId={eventId} />;
}

function AttendancePageInner({ eventId }: { eventId: string }) {
  const { role } = useAuth();
  const { toast } = useToast();
  const { data: event } = useEvent(eventId);
  const { data: session, isLoading: sessionLoading } = useAttendanceSession(eventId);
  const openSession = useOpenSession();
  const closeSession = useCloseSession();
  const exportAttendance = useExportAttendance();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const isOpen = session?.is_open ?? false;
  const sessionId = isOpen ? session?.id : undefined;

  const { currentToken, currentCode, isActive, error: qrError, retry: retryQR } = useQRRotation({
    sessionId,
  });


  if (sessionLoading) {
    return (
      <>
        <PageHeader title="Attendance" showBack />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={event?.title || "Attendance"} showBack />

      <div className="space-y-4 p-4">
        {/* Export button — visible to admins regardless of session state */}
        {role === "admin" && (
          <Button
            variant="outline"
            loading={exportAttendance.isPending}
            onClick={() => exportAttendance.mutate(eventId)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Attendance
          </Button>
        )}

        {/* Session controls */}
        {!isOpen ? (
          <Card className="space-y-3 text-center">
            <p className="text-sm text-muted">
              No active attendance session
            </p>
            {role === "admin" && (
              <Button
                loading={openSession.isPending}
                onClick={() =>
                  openSession.mutate(eventId, {
                    onSuccess: () => {
                      haptics.success();
                      toast("Attendance session started");
                    },
                    onError: (err) => {
                      haptics.error();
                      toast(
                        err instanceof Error
                          ? err.message
                          : "Failed to start session",
                        "error",
                      );
                    },
                  })
                }
              >
                Start Attendance
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* QR Display */}
            <Card className="flex flex-col items-center py-6">
              <p className="mb-4 text-xs font-medium text-muted uppercase tracking-wide">
                Share to mark attendance
              </p>
              <QRDisplay token={currentToken} code={currentCode} isActive={isActive} error={qrError} onRetry={retryQR} />
            </Card>

            {/* Close session button */}
            {role === "admin" && (
              <Button
                variant="destructive"
                loading={closeSession.isPending}
                onClick={() => {
                  if (!session) return;
                  setShowCloseConfirm(true);
                }}
              >
                Close Session
              </Button>
            )}

          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Close Attendance"
        description="Students will no longer be able to use the attendance code after you close the session."
        confirmLabel="Close Session"
        tone="danger"
        isLoading={closeSession.isPending}
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          if (!session) return;
          closeSession.mutate(session.id, {
            onSuccess: () => {
              haptics.success();
              toast("Session closed");
              setShowCloseConfirm(false);
            },
            onError: (err) => {
              haptics.error();
              toast(
                err instanceof Error
                  ? err.message
                  : "Failed to close session",
                "error",
              );
              setShowCloseConfirm(false);
            },
          });
        }}
      />
    </>
  );
}
