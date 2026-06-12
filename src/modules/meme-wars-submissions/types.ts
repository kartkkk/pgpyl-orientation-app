import type { SectionCode } from "@/types";

export type MemeSlotNumber = 1 | 2 | 3;

export const MEME_SLOT_NUMBERS: MemeSlotNumber[] = [1, 2, 3];

export const MEME_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export interface MemeSlotSubmission {
  slot: MemeSlotNumber;
  fileId: string | null;
  fileName: string | null;
  imageUrl: string | null;
  mimeType: string | null;
  submittedAt: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
}

export interface MemeWarsDayState {
  dateKey: string;
  sectionCode: SectionCode;
  slots: MemeSlotSubmission[];
}

export interface MemeWarsUploadInput {
  slot: MemeSlotNumber;
  file: File;
  submittedByName: string;
  submittedByEmail: string;
}

export interface MemeWarsDeleteInput {
  slot: MemeSlotNumber;
}

export interface PreparedMemeImage {
  mimeType: string;
  base64Data: string;
  fileName: string;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

export interface MemeUploadDraft {
  slot: MemeSlotNumber;
  createdAt: string;
  dateKey: string;
  submittedByName: string;
  submittedByEmail: string;
  originalFileName: string;
  mimeType: string;
  base64Data?: string;
}

export interface MemeWarsApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}
