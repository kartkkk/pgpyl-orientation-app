"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  useNotification,
  useUpdateNotification,
} from "@/modules/notifications/hooks/useNotifications";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import type { NotificationFormData } from "@/modules/notifications/types";

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function EditAlertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: notification, isLoading } = useNotification(id);
  const updateNotification = useUpdateNotification();

  const initialForm = useMemo(() => {
    if (!notification) return null;

    return {
      title: notification.title,
      body: notification.body,
      scheduled_at: notification.scheduled_at
        ? toDatetimeLocal(notification.scheduled_at)
        : "",
      visibility: "all" as const,
      section_ids: [],
      profile_ids: [],
      deep_link: notification.deep_link ?? undefined,
      event_id: notification.event_id ?? undefined,
    };
  }, [notification]);

  const [formDraft, setFormDraft] = useState<NotificationFormData | null>(null);
  const form = formDraft ?? initialForm;

  if (isLoading || !notification || !form) {
    return (
      <>
        <PageHeader title="Edit Alert" showBack />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  const update = (field: keyof NotificationFormData, value: string) =>
    setFormDraft((prev) => ({ ...(prev ?? form), [field]: value }));

  const titleLength = form.title.length;
  const bodyLength = form.body.length;
  const isEditable = notification.status === "draft" || notification.status === "scheduled";
  const isValid =
    isEditable &&
    form.title.trim() &&
    form.body.trim() &&
    titleLength <= 50 &&
    bodyLength <= 200 &&
    form.scheduled_at;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateNotification.isPending || !isValid) return;

    try {
      await updateNotification.mutateAsync({
        id,
        updates: {
          ...form,
          visibility: "all",
          section_ids: [],
          profile_ids: [],
          scheduled_at: form.scheduled_at
            ? new Date(form.scheduled_at).toISOString()
            : undefined,
        },
      });
      haptics.success();
      router.push("/alerts");
    } catch {
      haptics.error();
    }
  };

  return (
    <>
      <PageHeader title="Edit Alert" showBack />

      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {!isEditable && (
          <p className="rounded-xl bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
            This alert has already been sent and cannot be edited.
          </p>
        )}

        <div>
          <Input
            label="Title"
            placeholder="Enter a title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            maxLength={50}
            disabled={!isEditable}
            required
          />
          <p className="mt-1 text-right text-xs text-muted">{titleLength}/50</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Body</label>
          <textarea
            placeholder="Enter a body"
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
            maxLength={200}
            rows={3}
            disabled={!isEditable}
            required
            className="w-full rounded-xl border border-border px-3.5 py-3 text-sm placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-muted"
          />
          <p className="mt-1 text-right text-xs text-muted">{bodyLength}/200</p>
        </div>

        <Input
          label="Scheduled date and time"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => update("scheduled_at", e.target.value)}
          disabled={!isEditable}
          helperText="This controls when the push reminder goes out"
          required
        />

        {updateNotification.isError && (
          <p className="text-sm text-error">
            {getFriendlyErrorMessage(
              updateNotification.error?.message || "Failed to update alert",
            )}
          </p>
        )}

        <Button
          type="submit"
          loading={updateNotification.isPending}
          disabled={!isValid}
        >
          Save Alert
        </Button>
      </form>
    </>
  );
}
