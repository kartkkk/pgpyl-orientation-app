import { supabase } from "@/lib/supabase";
import type { Document } from "@/types";
import type { DocumentFormData, DocumentFilters } from "../types";

export async function fetchDocuments(
  filters?: DocumentFilters,
  page = 1,
  pageSize = 50,
): Promise<Document[]> {
  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }
  if (filters?.visibility) {
    query = query.eq("visibility", filters.visibility);
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function fetchMyDocuments(page = 1, pageSize = 50): Promise<Document[]> {
  // RLS handles visibility filtering
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function createDocument(
  form: DocumentFormData,
): Promise<Document> {
  // 1. Insert document
  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      title: form.title.trim(),
      url: form.url.trim(),
      description: form.description?.trim() || null,
      visibility: form.visibility,
    })
    .select()
    .single();

  if (error) throw error;

  // 2. Insert assignments if needed
  if (form.visibility === "section" && form.section_ids.length > 0) {
    const assignments = form.section_ids.map((sId) => ({
      document_id: doc.id,
      section_id: sId,
    }));
    const { error: aErr } = await supabase
      .from("document_assignments")
      .insert(assignments);
    if (aErr) throw aErr;
  } else if (form.visibility === "individual" && form.profile_ids.length > 0) {
    const assignments = form.profile_ids.map((pId) => ({
      document_id: doc.id,
      profile_id: pId,
    }));
    const { error: aErr } = await supabase
      .from("document_assignments")
      .insert(assignments);
    if (aErr) throw aErr;
  }

  return doc as Document;
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentFormData>,
): Promise<Document> {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.url !== undefined) payload.url = updates.url.trim();
  if (updates.description !== undefined)
    payload.description = updates.description?.trim() || null;
  if (updates.visibility !== undefined) payload.visibility = updates.visibility;

  const { data, error } = await supabase
    .from("documents")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
