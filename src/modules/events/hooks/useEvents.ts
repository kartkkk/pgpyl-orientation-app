import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEvents,
  fetchEventById,
  fetchMyEvents,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
} from "../services/events.service";
import type { EventFormData, EventFilters } from "../types";
import { useAuth } from "@/modules/auth/auth-context";
import type { Event } from "@/types";

export const QUERY_KEYS = {
  events: ["events"] as const,
  event: (id: string) => ["events", id] as const,
  eventsFiltered: (filters?: EventFilters) => ["events", filters] as const,
  myEvents: ["my-events"] as const,
};

const EVENTS_KEY = QUERY_KEYS.events[0];
const MY_EVENTS_KEY = QUERY_KEYS.myEvents[0];

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: [EVENTS_KEY, filters],
    queryFn: () => fetchEvents(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: [EVENTS_KEY, id],
    queryFn: () => fetchEventById(id),
    enabled: !!id,
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: [MY_EVENTS_KEY],
    queryFn: () => fetchMyEvents(),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: (form: EventFormData) => createEvent(form, profile!.id),
    onMutate: async (form) => {
      await qc.cancelQueries({ queryKey: [EVENTS_KEY] });
      const previousEvents = qc.getQueryData<Event[]>([EVENTS_KEY]);

      // Optimistically prepend the new event to the default (no-filter) list
      qc.setQueryData<Event[]>([EVENTS_KEY, undefined], (old) => {
        if (!old) return old;
        const optimistic: Event = {
          id: `temp-${Date.now()}`,
          title: form.title,
          description: form.description || null,
          venue: form.venue || null,
          starts_at: form.starts_at,
          ends_at: form.ends_at || null,
          visibility: form.visibility,
          outlook_event_id: null,
          outlook_calendar_id: null,
          ical_uid: null,
          is_cancelled: false,
          created_by: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [optimistic, ...old];
      });

      return { previousEvents };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEvents) {
        qc.setQueryData([EVENTS_KEY, undefined], context.previousEvents);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [EVENTS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_EVENTS_KEY] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<EventFormData>;
    }) => updateEvent(id, updates),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: [EVENTS_KEY, id] });
      const previousEvent = qc.getQueryData<Event>([EVENTS_KEY, id]);

      qc.setQueryData<Event>([EVENTS_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, ...updates, updated_at: new Date().toISOString() };
      });

      return { previousEvent };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousEvent) {
        qc.setQueryData([EVENTS_KEY, id], context.previousEvent);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [EVENTS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_EVENTS_KEY] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [EVENTS_KEY] });

      // Remove from list caches
      const previousEvents = qc.getQueryData<Event[]>([EVENTS_KEY, undefined]);
      qc.setQueryData<Event[]>([EVENTS_KEY, undefined], (old) => {
        if (!old) return old;
        return old.filter((e) => e.id !== id);
      });

      return { previousEvents };
    },
    onError: (_err, _id, context) => {
      if (context?.previousEvents) {
        qc.setQueryData([EVENTS_KEY, undefined], context.previousEvents);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [EVENTS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_EVENTS_KEY] });
    },
  });
}

export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelEvent(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [EVENTS_KEY, id] });
      const previousEvent = qc.getQueryData<Event>([EVENTS_KEY, id]);

      // Optimistically mark as cancelled in the detail cache
      qc.setQueryData<Event>([EVENTS_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, is_cancelled: true, updated_at: new Date().toISOString() };
      });

      // Also mark as cancelled in list caches
      const previousEvents = qc.getQueryData<Event[]>([EVENTS_KEY, undefined]);
      qc.setQueryData<Event[]>([EVENTS_KEY, undefined], (old) => {
        if (!old) return old;
        return old.map((e) =>
          e.id === id ? { ...e, is_cancelled: true, updated_at: new Date().toISOString() } : e,
        );
      });

      return { previousEvent, previousEvents };
    },
    onError: (_err, id, context) => {
      if (context?.previousEvent) {
        qc.setQueryData([EVENTS_KEY, id], context.previousEvent);
      }
      if (context?.previousEvents) {
        qc.setQueryData([EVENTS_KEY, undefined], context.previousEvents);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [EVENTS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_EVENTS_KEY] });
    },
  });
}
