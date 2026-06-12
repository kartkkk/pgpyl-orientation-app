import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchNotificationById,
  fetchMyNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  cancelNotification,
  NOTIFICATIONS_PAGE_SIZE,
} from "../services/notifications.service";
import type { NotificationFormData, NotificationFilters } from "../types";
import { useAuth } from "@/modules/auth/auth-context";
import type { Notification } from "@/types";

const NOTIFS_KEY = "notifications";
const MY_NOTIFS_KEY = "my-notifications";

export function useNotifications(filters?: NotificationFilters) {
  return useInfiniteQuery({
    queryKey: [NOTIFS_KEY, filters],
    queryFn: ({ pageParam = 1 }) => fetchNotifications(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === NOTIFICATIONS_PAGE_SIZE ? lastPageParam + 1 : undefined,
    select: (data) => data.pages?.flat() ?? [],
  });
}

export function useNotification(id?: string) {
  return useQuery({
    queryKey: [NOTIFS_KEY, id],
    queryFn: () => fetchNotificationById(id!),
    enabled: !!id,
  });
}

export function useMyNotifications() {
  return useInfiniteQuery({
    queryKey: [MY_NOTIFS_KEY],
    queryFn: ({ pageParam = 1 }) => fetchMyNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === NOTIFICATIONS_PAGE_SIZE ? lastPageParam + 1 : undefined,
    select: (data) => data.pages?.flat() ?? [],
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    retry: false,
    mutationFn: (form: NotificationFormData) => createNotification(form, profile!.id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [NOTIFS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_NOTIFS_KEY] });
    },
  });
}

export function useUpdateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<NotificationFormData>;
    }) => updateNotification(id, updates),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: [NOTIFS_KEY, id] });
      const previousNotification = qc.getQueryData<Notification>([NOTIFS_KEY, id]);

      qc.setQueryData<Notification>([NOTIFS_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, ...updates, updated_at: new Date().toISOString() };
      });

      return { previousNotification };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousNotification) {
        qc.setQueryData([NOTIFS_KEY, id], context.previousNotification);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [NOTIFS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_NOTIFS_KEY] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [NOTIFS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_NOTIFS_KEY] });
    },
  });
}

export function useCancelNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [NOTIFS_KEY, id] });
      const previousNotification = qc.getQueryData<Notification>([NOTIFS_KEY, id]);

      qc.setQueryData<Notification>([NOTIFS_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, status: "draft" as const, updated_at: new Date().toISOString() };
      });

      return { previousNotification };
    },
    onError: (_err, id, context) => {
      if (context?.previousNotification) {
        qc.setQueryData([NOTIFS_KEY, id], context.previousNotification);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [NOTIFS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_NOTIFS_KEY] });
    },
  });
}
