import { useMemo } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  fetchStudents,
  fetchStudentById,
  fetchSections,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  STUDENTS_PAGE_SIZE,
} from "../services/students.service";
import type { StudentFormData, StudentFilters, CSVColumnMapping } from "../types";

export const STUDENTS_KEY = "students";
const SECTIONS_KEY = "sections";

export function useStudents(filters?: StudentFilters) {
  return useInfiniteQuery({
    queryKey: [STUDENTS_KEY, filters],
    queryFn: ({ pageParam = 1 }) => fetchStudents(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === STUDENTS_PAGE_SIZE ? lastPageParam + 1 : undefined,
    select: (data) => data.pages?.flat() ?? [],
  });
}

/** Prefetch the first page of the student directory into the query cache. */
export async function prefetchStudents(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchInfiniteQuery({
    queryKey: [STUDENTS_KEY, undefined],
    queryFn: ({ pageParam = 1 }) => fetchStudents(undefined, pageParam),
    initialPageParam: 1,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: [STUDENTS_KEY, id],
    queryFn: () => fetchStudentById(id),
    enabled: !!id,
  });
}

export function useSections() {
  return useQuery({
    queryKey: [SECTIONS_KEY],
    queryFn: fetchSections,
    staleTime: Infinity, // sections never change
  });
}

/** Cached code → {id, code} map derived from the shared sections query. */
export function useSectionMap() {
  const { data: sections } = useSections();
  return useMemo(() => {
    const map = new Map<string, { id: string; code: string }>();
    for (const s of sections ?? []) {
      map.set(s.code, { id: s.id, code: s.code });
    }
    return map;
  }, [sections]);
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: StudentFormData) => createStudent(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<StudentFormData>;
    }) => updateStudent(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  });
}

export function useBulkUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rows,
      mapping,
    }: {
      rows: Record<string, string>[];
      mapping: CSVColumnMapping;
    }) => bulkUploadStudents(rows, mapping),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  });
}
