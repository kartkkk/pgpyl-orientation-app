import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SectionCode } from "@/types";
import {
  deleteSlot,
  fetchTodaySlots,
  uploadOrReplaceSlot,
} from "../services/meme-wars-submissions.service";
import type {
  MemeWarsDeleteInput,
  MemeWarsUploadInput,
} from "../types";

const MEME_WARS_KEY = "meme-wars-submissions";

function queryKey(sectionCode: SectionCode | null) {
  return [MEME_WARS_KEY, sectionCode];
}

export function useMemeWarsSubmissions(sectionCode: SectionCode | null) {
  return useQuery({
    queryKey: queryKey(sectionCode),
    queryFn: () => {
      if (!sectionCode) {
        throw new Error("No section assigned.");
      }

      return fetchTodaySlots(sectionCode);
    },
    enabled: !!sectionCode,
    staleTime: 30_000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}

export function useUploadMemeSlot(sectionCode: SectionCode | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MemeWarsUploadInput) => {
      if (!sectionCode) {
        throw new Error("No section assigned.");
      }

      return uploadOrReplaceSlot(input, sectionCode);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey(sectionCode), data);
      void queryClient.invalidateQueries({
        queryKey: queryKey(sectionCode),
        refetchType: "active",
      });
    },
  });
}

export function useDeleteMemeSlot(sectionCode: SectionCode | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MemeWarsDeleteInput) => {
      if (!sectionCode) {
        throw new Error("No section assigned.");
      }

      return deleteSlot(input, sectionCode);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey(sectionCode), data);
      void queryClient.invalidateQueries({
        queryKey: queryKey(sectionCode),
        refetchType: "active",
      });
    },
  });
}
