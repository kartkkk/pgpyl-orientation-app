"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Eye, Users, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useEvent, useCancelEvent, useDeleteEvent } from "@/modules/events/hooks/useEvents";
import { useAttendanceSession } from "@/modules/attendance/hooks/useAttendance";
import { useAuth } from "@/modules/auth/auth-context";
import { haptics } from "@/lib/haptics";
import { formatDate, formatTime, formatDateTime, isUpcoming } from "@/lib/utils";
import { getVenueDetails } from "@/modules/events/venue-metadata";
import type { VisibilityScope } from "@/types";

const VISIBILITY_LABELS: Record<VisibilityScope, string> = {
  all: "All students",
  section: "By section",
  individual: "Specific students",
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { role } = useAuth();
  const { data: event, isLoading } = useEvent(id);
  const { data: session } = useAttendanceSession(id);
  const cancelEvent = useCancelEvent();
  const deleteEventMutation = useDeleteEvent();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading || !event) {
    return (
      <>
        <PageHeader title="Event" showBack />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  const upcoming = isUpcoming(event.starts_at);
  const hasOpenSession = session?.is_open;
  const venueDetails = getVenueDetails(event.venue);
  const venueLabel = venueDetails?.name ?? event.venue;

  return (
    <>
      <PageHeader title="Event Details" showBack />

      <div className="space-y-4 p-4">
        {/* Main info card */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-foreground">
                {event.title}
              </h2>
              {event.is_cancelled && (
                <StatusBadge status="Cancelled" variant="error" />
              )}
            </div>

            {event.description && (
              <p className="text-sm text-muted">{event.description}</p>
            )}

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formatDate(event.starts_at)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {formatTime(event.starts_at)}
                  {event.ends_at && ` - ${formatTime(event.ends_at)}`}
                </span>
              </div>

              {venueLabel && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{venueLabel}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted">
                <Eye className="h-4 w-4 shrink-0" />
                <span>{VISIBILITY_LABELS[event.visibility]}</span>
              </div>

              {event.creator?.full_name && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Created by {event.creator.full_name}</span>
                </div>
              )}
            </div>

            {venueDetails && (
              <div className="rounded-xl bg-gray-50/80 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Location
                </p>
                {venueDetails.directions && (
                  <p className="mt-2 text-sm text-foreground">
                    {venueDetails.directions}
                  </p>
                )}
                <a
                  href={venueDetails.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-medium text-primary-600 underline-offset-2 hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Admin actions */}
        {role === "admin" && !event.is_cancelled && (
          <div className="flex flex-col gap-3">
            <Link href={`/events/${id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Event
              </Button>
            </Link>

            <Link href={`/events/${id}/attendance`}>
              <Button variant={hasOpenSession ? "primary" : "outline"}>
                {hasOpenSession ? "View Attendance Session" : "Manage Attendance"}
              </Button>
            </Link>

            {upcoming && (
              <Button
                variant="destructive"
                loading={cancelEvent.isPending}
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel Event
              </Button>
            )}

            <Button
              variant="destructive"
              loading={deleteEventMutation.isPending}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Event
            </Button>
          </div>
        )}

        {/* Meta */}
        {role === "admin" && (
          <p className="text-center text-xs text-muted">
            Created {formatDateTime(event.created_at)}
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Cancel Event"
        description="This will mark the event as cancelled for everyone. You can’t undo this action."
        confirmLabel="Cancel Event"
        tone="danger"
        isLoading={cancelEvent.isPending}
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          cancelEvent.mutate(id, {
            onSuccess: () => {
              haptics.success();
              setShowCancelConfirm(false);
            },
            onError: () => {
              haptics.error();
              setShowCancelConfirm(false);
            },
          });
        }}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Event"
        description="This will permanently delete the event and all its attendance records. This action cannot be undone."
        confirmLabel="Delete Event"
        tone="danger"
        isLoading={deleteEventMutation.isPending}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteEventMutation.mutate(id, {
            onSuccess: () => {
              haptics.success();
              setShowDeleteConfirm(false);
              router.push("/events");
            },
            onError: () => {
              haptics.error();
              setShowDeleteConfirm(false);
            },
          });
        }}
      />
    </>
  );
}
