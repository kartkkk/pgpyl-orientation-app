import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types";
import type { NotificationFormData, NotificationFilters } from "../types";

export const NOTIFICATIONS_PAGE_SIZE = 50;

export async function fetchNotifications(
  filters?: NotificationFilters,
  page = 1,
  pageSize = NOTIFICATIONS_PAGE_SIZE,
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function fetchNotificationById(
  id: string,
): Promise<Notification & { notification_assignments: unknown[] }> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, notification_assignments(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Notification & { notification_assignments: unknown[] };
}

export async function fetchMyNotifications(
  page = 1,
  pageSize = NOTIFICATIONS_PAGE_SIZE,
): Promise<Notification[]> {
  // RLS handles visibility filtering; only show sent notifications
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function createNotification(
  form: NotificationFormData,
  userId: string,
): Promise<Notification> {
  void userId;
  const response = await fetch("/api/alerts/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to create alert");
  }

  return data as Notification;
}

export async function updateNotification(
  id: string,
  updates: Partial<NotificationFormData>,
): Promise<Notification> {
  // Only allow updates when status is 'draft' or 'scheduled'
  const { data: existing, error: fetchErr } = await supabase
    .from("notifications")
    .select("status, visibility")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;
  if (existing.status !== "draft" && existing.status !== "scheduled") {
    throw new Error(`Cannot update notification with status "${existing.status}"`);
  }

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.body !== undefined) payload.body = updates.body.trim();
  if (updates.deep_link !== undefined)
    payload.deep_link = updates.deep_link?.trim() || null;
  if (updates.visibility !== undefined) payload.visibility = updates.visibility;
  if (updates.event_id !== undefined) payload.event_id = updates.event_id || null;
  if (updates.scheduled_at !== undefined)
    payload.scheduled_at = updates.scheduled_at || null;

  const { data, error } = await supabase
    .from("notifications")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Rebuild assignments if visibility changed
  if (updates.visibility !== undefined) {
    // Remove old assignments
    const { error: delErr } = await supabase
      .from("notification_assignments")
      .delete()
      .eq("notification_id", id);
    if (delErr) throw delErr;

    // Insert new assignments
    if (updates.visibility === "section" && updates.section_ids?.length) {
      const assignments = updates.section_ids.map((sId) => ({
        notification_id: id,
        section_id: sId,
      }));
      const { error: aErr } = await supabase
        .from("notification_assignments")
        .insert(assignments);
      if (aErr) throw aErr;
    } else if (updates.visibility === "individual" && updates.profile_ids?.length) {
      const assignments = updates.profile_ids.map((pId) => ({
        notification_id: id,
        profile_id: pId,
      }));
      const { error: aErr } = await supabase
        .from("notification_assignments")
        .insert(assignments);
      if (aErr) throw aErr;
    }
  }

  return data as Notification;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

export async function cancelNotification(id: string): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ status: "draft" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

/**
 * Persists the FCM token to the user's profile, but only if it has actually
 * changed. Returns true if a write was performed.
 */
export async function saveFCMTokenIfChanged(
  newToken: string,
  currentToken: string | null,
  userId: string,
): Promise<boolean> {
  if (newToken === currentToken) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ fcm_token: newToken })
    .eq("id", userId);

  if (error) throw error;
  return true;
}
