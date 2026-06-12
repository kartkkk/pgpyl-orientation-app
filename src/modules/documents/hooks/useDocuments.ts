import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments,
  fetchMyDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../services/documents.service";
import type { DocumentFormData, DocumentFilters } from "../types";

const DOCS_KEY = "documents";

export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: [DOCS_KEY, filters],
    queryFn: () => fetchDocuments(filters),
  });
}

export function useMyDocuments() {
  return useQuery({
    queryKey: [DOCS_KEY, "mine"],
    queryFn: () => fetchMyDocuments(),
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: DocumentFormData) => createDocument(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOCS_KEY] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<DocumentFormData>;
    }) => updateDocument(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOCS_KEY] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DOCS_KEY] }),
  });
}
