import { supabase } from "@/lib/supabase";
import type { Event, EventAssignment } from "@/types";
import type { EventFormData, EventFilters } from "../types";
import { canonicalizeVenueName } from "../venue-metadata";

// ─── Joined types (returned by select with joins) ────────────────────────────

interface EventWithSection extends Event {
  event_assignments?: (EventAssignment & {
    section: { id: string; code: string; name: string } | null;
  })[];
}

interface EventWithAssignments extends Event {
  event_assignments?: EventAssignment[];
  creator?: { full_name: string } | null;
}

type EventDetailRow = Event & {
  creator?: { full_name: string } | { full_name: string }[] | null;
};

// ─── Read ────────────────────────────────────────────────────────────────────

export async function fetchEvents(
  filters?: EventFilters,
  page = 1,
  pageSize = 50,
): Promise<EventWithSection[]> {
  const ascending = filters?.dateFrom ? true : !filters?.past;
  let query = supabase
    .from("events")
    .select("id,title,description,venue,starts_at,ends_at,visibility,outlook_event_id,outlook_calendar_id,ical_uid,is_cancelled,created_by,created_at,updated_at")
    .order("starts_at", { ascending });

  if (!filters?.includeCancelled) {
    query = query.eq("is_cancelled", false);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,venue.ilike.%${filters.search}%`,
    );
  }

  if (filters?.upcoming) {
    query = query.gte("starts_at", new Date().toISOString());
  }

  if (filters?.past) {
    query = query.lt("starts_at", new Date().toISOString());
  }

  if (filters?.dateFrom) {
    query = query.gte("starts_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lt("starts_at", filters.dateTo);
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load events: ${error.message}`);
  return (data ?? []) as EventWithSection[];
}

export async function fetchEventById(id: string): Promise<EventWithAssignments> {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,description,venue,starts_at,ends_at,visibility,outlook_event_id,outlook_calendar_id,ical_uid,is_cancelled,created_by,created_at,updated_at,creator:profiles!events_created_by_fkey(full_name)")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Failed to load event details: ${error.message}`);
  const row = data as EventDetailRow;
  const creator = Array.isArray(row.creator) ? row.creator[0] ?? null : row.creator ?? null;
  return { ...row, creator } as EventWithAssignments;
}

export async function fetchMyEvents(page = 1, pageSize = 50): Promise<EventWithSection[]> {
  // Relies on Supabase RLS policies to filter events visible to the
  // authenticated user (by section membership or individual assignment).
  const { data, error } = await supabase
    .from("events")
    .select("id,title,description,venue,starts_at,ends_at,visibility,outlook_event_id,outlook_calendar_id,ical_uid,is_cancelled,created_by,created_at,updated_at")
    .eq("is_cancelled", false)
    .order("starts_at", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw new Error(`Failed to load your events: ${error.message}`);
  return (data ?? []) as EventWithSection[];
}

// ─── Write ───────────────────────────────────────────────────────────────────

export async function createEvent(form: EventFormData, userId: string): Promise<EventWithAssignments> {
  void userId;
  const response = await fetch("/api/events/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to create event");
  }

  return data as EventWithAssignments;
}

export async function updateEvent(
  id: string,
  updates: Partial<EventFormData>,
): Promise<EventWithAssignments> {
  const payload: Record<string, unknown> = {};

  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined)
    payload.description = updates.description.trim() || null;
  if (updates.venue !== undefined) payload.venue = canonicalizeVenueName(updates.venue);
  if (updates.starts_at !== undefined) payload.starts_at = updates.starts_at;
  if (updates.ends_at !== undefined) payload.ends_at = updates.ends_at || null;
  if (updates.visibility !== undefined) payload.visibility = updates.visibility;

  // 1. Update the event row and get the updated data back
  const { data: updatedEvent, error: eventError } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (eventError) throw new Error(`Failed to update event: ${eventError.message}`);

  // 2. If visibility or target audience changed, rebuild assignments
  let finalAssignments: EventAssignment[];

  if (
    updates.visibility !== undefined ||
    updates.section_ids !== undefined ||
    updates.profile_ids !== undefined
  ) {
    // The form always provides the full new state — no need to re-fetch
    const visibility = updates.visibility ?? updatedEvent.visibility;
    const sectionIds = updates.section_ids ?? [];
    const profileIds = updates.profile_ids ?? [];

    // Delete old assignments and insert new ones
    const { error: deleteError } = await supabase
      .from("event_assignments")
      .delete()
      .eq("event_id", id);

    if (deleteError) throw new Error(`Failed to update event assignments: ${deleteError.message}`);

    const assignments = buildAssignmentRows(id, visibility, sectionIds, profileIds);

    if (assignments.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("event_assignments")
        .insert(assignments)
        .select("*");

      if (insertError) throw insertError;
      finalAssignments = (inserted ?? []) as EventAssignment[];
    } else {
      finalAssignments = [];
    }
  } else {
    // Non-assignment update: fetch existing assignments to preserve the contract
    const { data: existing } = await supabase
      .from("event_assignments")
      .select("*")
      .eq("event_id", id);
    finalAssignments = (existing ?? []) as EventAssignment[];
  }

  return { ...updatedEvent, event_assignments: finalAssignments } as EventWithAssignments;
}

export async function cancelEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ is_cancelled: true })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  // Delete pending notifications before the event is deleted.
  // The notifications.event_id FK is ON DELETE SET NULL, so deleting the event
  // would orphan any scheduled notifications rather than cascade-deleting them.
  await supabase
    .from("notifications")
    .delete()
    .eq("event_id", id)
    .in("status", ["draft", "scheduled"]);

  // event_assignments are cascade-deleted via ON DELETE CASCADE FK constraint
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete event: ${error.message}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAssignmentRows(
  eventId: string,
  visibility: string,
  sectionIds: string[],
  profileIds: string[],
): { event_id: string; section_id: string | null; profile_id: string | null }[] {
  switch (visibility) {
    case "all":
      // No assignment rows needed — visible to everyone
      return [];

    case "section":
      return sectionIds.map((sectionId) => ({
        event_id: eventId,
        section_id: sectionId,
        profile_id: null,
      }));

    case "individual":
      return profileIds.map((profileId) => ({
        event_id: eventId,
        section_id: null,
        profile_id: profileId,
      }));

    default:
      return [];
  }
}
