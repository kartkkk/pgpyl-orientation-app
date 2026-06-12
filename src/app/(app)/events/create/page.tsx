"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VenueInput } from "@/components/ui/venue-input";
import { useCreateEvent } from "@/modules/events/hooks/useEvents";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import type { EventFormData } from "@/modules/events/types";
import { getVenueDetails } from "@/modules/events/venue-metadata";

export default function CreateEventPage() {
  const router = useRouter();
  const createEvent = useCreateEvent();

  const [form, setForm] = useState<EventFormData>({
    title: "",
    description: "",
    venue: "",
    starts_at: "",
    ends_at: "",
    visibility: "all",
    section_ids: [],
    profile_ids: [],
  });

  const update = (field: keyof EventFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createEvent.isPending) return;

    try {
      await createEvent.mutateAsync({
        ...form,
        visibility: "all",
        section_ids: [],
        profile_ids: [],
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : "",
      });
      haptics.success();
      router.push("/events");
    } catch {
      haptics.error();
      // Error handled by mutation state
    }
  };

  const isValid =
    form.title.trim() &&
    form.starts_at;
  const selectedVenueDetails = getVenueDetails(form.venue);

  return (
    <>
      <PageHeader title="Create Event" showBack />

      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <Input
          label="Title"
          placeholder="Enter a title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            placeholder="Enter a description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border px-3.5 py-3 text-sm placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <VenueInput
          label="Venue"
          placeholder="Enter a venue"
          value={form.venue}
          onChange={(value) => update("venue", value)}
        />

        {selectedVenueDetails && (
          <Card className="space-y-2 bg-gray-50/80">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Location
            </p>
            {selectedVenueDetails.directions && (
              <p className="text-sm text-foreground">
                {selectedVenueDetails.directions}
              </p>
            )}
            <a
              href={selectedVenueDetails.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary-600 underline-offset-2 hover:underline"
            >
              Open in Google Maps
            </a>
          </Card>
        )}

        <Input
          label="Starts at"
          type="datetime-local"
          value={form.starts_at}
          onChange={(e) => update("starts_at", e.target.value)}
          required
        />

        <Input
          label="Ends at"
          type="datetime-local"
          value={form.ends_at}
          onChange={(e) => update("ends_at", e.target.value)}
        />

        {createEvent.isError && (
          <p className="text-sm text-error">
            {getFriendlyErrorMessage(createEvent.error?.message || "Failed to create event")}
          </p>
        )}

        <Button
          type="submit"
          loading={createEvent.isPending}
          disabled={!isValid}
        >
          Create Event
        </Button>
      </form>
    </>
  );
}
