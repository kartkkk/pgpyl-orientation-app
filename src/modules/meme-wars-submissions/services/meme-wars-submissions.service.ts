import { supabase } from "@/lib/supabase";
import { getFriendlyErrorMessage } from "@/lib/utils";
import type { SectionCode } from "@/types";
import {
  MEME_ACCEPTED_MIME_TYPES,
  MEME_SLOT_NUMBERS,
  type MemeUploadDraft,
  type MemeSlotNumber,
  type MemeSlotSubmission,
  type MemeWarsApiEnvelope,
  type MemeWarsDayState,
  type MemeWarsDeleteInput,
  type MemeWarsUploadInput,
  type PreparedMemeImage,
} from "../types";

const IST_TIMEZONE = "Asia/Kolkata";
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_TRANSPORT_BYTES = 2 * 1024 * 1024;
const MAX_DRAFT_BASE64_BYTES = 900_000;
const MAX_IMAGE_DIMENSION = 1600;
const DRAFTS_STORAGE_KEY_PREFIX = "meme-wars-submission-drafts";
const REQUEST_TIMEOUT_MS = 20_000;
const SUBMISSION_DEADLINE_HOUR_IST = 23;

const COMPRESSION_QUALITY_STEPS = [0.88, 0.78, 0.68, 0.58, 0.5];

type AppsScriptAction = "listTodaySlots" | "uploadOrReplaceSlot" | "deleteSlot";

interface AppsScriptRequestBase {
  action: AppsScriptAction;
  accessToken: string;
  dateKey: string;
  clientTimezone: typeof IST_TIMEZONE;
}

interface AppsScriptListRequest extends AppsScriptRequestBase {
  action: "listTodaySlots";
}

interface AppsScriptUploadRequest extends AppsScriptRequestBase {
  action: "uploadOrReplaceSlot";
  slot: MemeSlotNumber;
  imageBase64: string;
  mimeType: string;
  fileName: string;
  originalFileName: string;
  submittedByName: string;
  submittedByEmail: string;
  clientSectionCode: SectionCode;
}

interface AppsScriptDeleteRequest extends AppsScriptRequestBase {
  action: "deleteSlot";
  slot: MemeSlotNumber;
  clientSectionCode: SectionCode;
}

function requireAppsScriptUrl(): string {
  const endpoint = process.env.NEXT_PUBLIC_MEME_WARS_APPS_SCRIPT_URL?.trim();

  if (!endpoint) {
    throw new Error(
      "Meme Wars is not configured. Missing NEXT_PUBLIC_MEME_WARS_APPS_SCRIPT_URL.",
    );
  }

  return endpoint;
}

async function requireAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return session.access_token;
}

async function callAppsScript<T>(
  payload:
    | Omit<AppsScriptListRequest, "accessToken">
    | Omit<AppsScriptUploadRequest, "accessToken">
    | Omit<AppsScriptDeleteRequest, "accessToken">,
): Promise<T> {
  const endpoint = requireAppsScriptUrl();
  const accessToken = await requireAccessToken();

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        // text/plain avoids stricter browser preflight behavior in some Apps Script deployments.
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        ...payload,
        accessToken,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }

    throw new Error("Could not reach Meme Wars service. Please try again.");
  } finally {
    clearTimeout(timeoutHandle);
  }

  const responseText = await response.text();

  let envelope: MemeWarsApiEnvelope<T>;

  try {
    envelope = JSON.parse(responseText) as MemeWarsApiEnvelope<T>;
  } catch {
    throw new Error(`Meme Wars request failed (${response.status}).`);
  }

  if (!response.ok || !envelope.success || envelope.data === undefined) {
    const message = envelope.error ?? `Meme Wars request failed (${response.status}).`;
    throw new Error(getFriendlyErrorMessage(message));
  }

  return envelope.data;
}

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  const part = parts.find((entry) => entry.type === type);
  return part?.value ?? "";
}

export function getIstDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);

  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");

  return `${year}-${month}-${day}`;
}

function getIstHour(date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hourText = getDatePart(parts, "hour");
  const hour = Number(hourText);

  return Number.isFinite(hour) ? hour : 0;
}

export function isSubmissionWindowClosed(date = new Date()): boolean {
  return getIstHour(date) >= SUBMISSION_DEADLINE_HOUR_IST;
}

function assertSubmissionWindowOpen(): void {
  if (isSubmissionWindowClosed()) {
    throw new Error("Today's submission window closed at 11:00 PM IST.");
  }
}

function getIstTimestampForFileName(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);

  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");
  const hour = getDatePart(parts, "hour");
  const minute = getDatePart(parts, "minute");
  const second = getDatePart(parts, "second");

  return `${year}${month}${day}-${hour}${minute}${second}`;
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function sanitizeEmailForFileName(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, "-")
    .replace(/@/g, "-at-");
}

function buildCanonicalFileName(input: {
  slot: MemeSlotNumber;
  dateKey: string;
  sectionCode: SectionCode;
  submittedByEmail: string;
  mimeType: string;
}): string {
  const extension = extensionFromMimeType(input.mimeType);
  const timestamp = getIstTimestampForFileName();
  const emailPart = sanitizeEmailForFileName(input.submittedByEmail);

  return `meme_slot${input.slot}_${input.sectionCode}_${input.dateKey}_${timestamp}_${emailPart}.${extension}`;
}

function parseSlotNumber(value: unknown): MemeSlotNumber | null {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    if (numeric === 1 || numeric === 2 || numeric === 3) {
      return numeric;
    }
  }

  return null;
}

function normalizeSlot(rawSlot: unknown): MemeSlotSubmission | null {
  if (!rawSlot || typeof rawSlot !== "object") {
    return null;
  }

  const slotValue = parseSlotNumber((rawSlot as { slot?: unknown }).slot);

  if (!slotValue) {
    return null;
  }

  const record = rawSlot as Record<string, unknown>;

  return {
    slot: slotValue,
    fileId: typeof record.fileId === "string" ? record.fileId : null,
    fileName: typeof record.fileName === "string" ? record.fileName : null,
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : null,
    mimeType: typeof record.mimeType === "string" ? record.mimeType : null,
    submittedAt: typeof record.submittedAt === "string" ? record.submittedAt : null,
    submittedByName:
      typeof record.submittedByName === "string" ? record.submittedByName : null,
    submittedByEmail:
      typeof record.submittedByEmail === "string" ? record.submittedByEmail : null,
  };
}

function normalizeDayState(
  raw: unknown,
  expectedSectionCode: SectionCode,
  expectedDateKey: string,
): MemeWarsDayState {
  const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawSlots = Array.isArray(payload.slots) ? payload.slots : [];

  const normalizedMap = new Map<MemeSlotNumber, MemeSlotSubmission>();

  for (const slot of rawSlots) {
    const normalized = normalizeSlot(slot);

    if (normalized) {
      normalizedMap.set(normalized.slot, normalized);
    }
  }

  const normalizedSlots = MEME_SLOT_NUMBERS.map((slot) => {
    const existing = normalizedMap.get(slot);

    if (existing) {
      return existing;
    }

    return {
      slot,
      fileId: null,
      fileName: null,
      imageUrl: null,
      mimeType: null,
      submittedAt: null,
      submittedByName: null,
      submittedByEmail: null,
    };
  });

  const sectionCode =
    typeof payload.sectionCode === "string" && payload.sectionCode
      ? (payload.sectionCode as SectionCode)
      : expectedSectionCode;

  const dateKey =
    typeof payload.dateKey === "string" && payload.dateKey
      ? payload.dateKey
      : expectedDateKey;

  return {
    dateKey,
    sectionCode,
    slots: normalizedSlots,
  };
}

function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("We could not read that image. Please try another file."));
    };

    image.src = url;
  });
}

function decodeDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
  const commaIndex = dataUrl.indexOf(",");

  if (commaIndex === -1) {
    throw new Error("Invalid image payload generated during compression.");
  }

  const meta = dataUrl.slice(0, commaIndex);
  const base64Data = dataUrl.slice(commaIndex + 1);
  const mimeMatch = /^data:([^;]+);base64$/i.exec(meta);

  if (!mimeMatch) {
    throw new Error("Could not detect compressed image format.");
  }

  return {
    mimeType: mimeMatch[1],
    base64Data,
  };
}

function estimateBase64Bytes(base64Data: string): number {
  return Math.floor((base64Data.length * 3) / 4);
}

function chooseOutputMimeType(fileType: string): string {
  if (fileType === "image/webp") {
    return "image/webp";
  }

  if (fileType === "image/png") {
    return "image/jpeg";
  }

  return "image/jpeg";
}

export async function prepareImageForUpload(file: File): Promise<PreparedMemeImage> {
  if (!MEME_ACCEPTED_MIME_TYPES.includes(file.type as (typeof MEME_ACCEPTED_MIME_TYPES)[number])) {
    throw new Error("Only JPG, PNG, and WEBP images are supported.");
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Each meme must be 5 MB or smaller.");
  }

  const image = await createImageElement(file);
  const largestDimension = Math.max(image.width, image.height);
  const scale = largestDimension > MAX_IMAGE_DIMENSION
    ? MAX_IMAGE_DIMENSION / largestDimension
    : 1;

  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare this image. Please try a different browser.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const outputMimeType = chooseOutputMimeType(file.type);

  let bestCandidate: PreparedMemeImage | null = null;

  for (const quality of COMPRESSION_QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL(outputMimeType, quality);
    const decoded = decodeDataUrl(dataUrl);
    const compressedSizeBytes = estimateBase64Bytes(decoded.base64Data);

    const candidate: PreparedMemeImage = {
      mimeType: decoded.mimeType,
      base64Data: decoded.base64Data,
      fileName: file.name,
      width: targetWidth,
      height: targetHeight,
      originalSizeBytes: file.size,
      compressedSizeBytes,
    };

    if (!bestCandidate || candidate.compressedSizeBytes < bestCandidate.compressedSizeBytes) {
      bestCandidate = candidate;
    }

    if (compressedSizeBytes <= MAX_TRANSPORT_BYTES) {
      return candidate;
    }
  }

  if (bestCandidate && bestCandidate.compressedSizeBytes <= MAX_TRANSPORT_BYTES) {
    return bestCandidate;
  }

  throw new Error("Image is still too large after compression. Please pick a smaller file.");
}

function getDraftStorageKey(dateKey: string, scopeKey: string): string {
  return `${DRAFTS_STORAGE_KEY_PREFIX}:${scopeKey}:${dateKey}`;
}

export function readUploadDrafts(
  dateKey: string,
  scopeKey: string | null,
): Partial<Record<MemeSlotNumber, MemeUploadDraft>> {
  if (typeof window === "undefined") {
    return {};
  }

  if (!scopeKey) {
    return {};
  }

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(getDraftStorageKey(dateKey, scopeKey));
  } catch {
    return {};
  }

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, MemeUploadDraft>;
    const output: Partial<Record<MemeSlotNumber, MemeUploadDraft>> = {};

    for (const slot of MEME_SLOT_NUMBERS) {
      const draft = parsed[String(slot)];

      if (draft && draft.dateKey === dateKey) {
        output[slot] = draft;
      }
    }

    return output;
  } catch {
    return {};
  }
}

function writeUploadDrafts(
  nextState: Partial<Record<MemeSlotNumber, MemeUploadDraft>>,
  dateKey: string,
  scopeKey: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getDraftStorageKey(dateKey, scopeKey);

  const serializable: Record<string, MemeUploadDraft> = {};

  for (const slot of MEME_SLOT_NUMBERS) {
    const draft = nextState[slot];

    if (draft) {
      serializable[String(slot)] = draft;
    }
  }

  if (Object.keys(serializable).length === 0) {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Best-effort cache cleanup only.
    }
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(serializable));
  } catch {
    // Best-effort draft persistence; do not block core upload flow.
  }
}

export function saveUploadDraft(draft: MemeUploadDraft, scopeKey: string | null): void {
  if (!scopeKey) {
    return;
  }

  const current = readUploadDrafts(draft.dateKey, scopeKey);
  current[draft.slot] = draft;
  writeUploadDrafts(current, draft.dateKey, scopeKey);
}

export function clearUploadDraft(
  slot: MemeSlotNumber,
  dateKey: string,
  scopeKey: string | null,
): void {
  if (!scopeKey) {
    return;
  }

  const current = readUploadDrafts(dateKey, scopeKey);

  if (current[slot]) {
    delete current[slot];
    writeUploadDrafts(current, dateKey, scopeKey);
  }
}

export async function fetchTodaySlots(sectionCode: SectionCode): Promise<MemeWarsDayState> {
  const dateKey = getIstDateKey();

  const payload = await callAppsScript<unknown>({
    action: "listTodaySlots",
    dateKey,
    clientTimezone: IST_TIMEZONE,
  });

  return normalizeDayState(payload, sectionCode, dateKey);
}

export async function uploadOrReplaceSlot(
  input: MemeWarsUploadInput,
  sectionCode: SectionCode,
): Promise<MemeWarsDayState> {
  assertSubmissionWindowOpen();

  const prepared = await prepareImageForUpload(input.file);
  const dateKey = getIstDateKey();

  const payload = await callAppsScript<unknown>({
    action: "uploadOrReplaceSlot",
    dateKey,
    clientTimezone: IST_TIMEZONE,
    slot: input.slot,
    imageBase64: prepared.base64Data,
    mimeType: prepared.mimeType,
    fileName: buildCanonicalFileName({
      slot: input.slot,
      dateKey,
      sectionCode,
      submittedByEmail: input.submittedByEmail,
      mimeType: prepared.mimeType,
    }),
    originalFileName: prepared.fileName,
    submittedByName: input.submittedByName,
    submittedByEmail: input.submittedByEmail,
    clientSectionCode: sectionCode,
  });

  return normalizeDayState(payload, sectionCode, dateKey);
}

export async function deleteSlot(
  input: MemeWarsDeleteInput,
  sectionCode: SectionCode,
): Promise<MemeWarsDayState> {
  assertSubmissionWindowOpen();

  const dateKey = getIstDateKey();

  const payload = await callAppsScript<unknown>({
    action: "deleteSlot",
    dateKey,
    clientTimezone: IST_TIMEZONE,
    slot: input.slot,
    clientSectionCode: sectionCode,
  });

  return normalizeDayState(payload, sectionCode, dateKey);
}

export function buildUploadDraft(
  input: MemeWarsUploadInput,
  dateKey: string,
  base64Data?: string,
): MemeUploadDraft {
  return {
    slot: input.slot,
    createdAt: new Date().toISOString(),
    dateKey,
    submittedByName: input.submittedByName,
    submittedByEmail: input.submittedByEmail,
    originalFileName: input.file.name,
    mimeType: input.file.type,
    base64Data:
      base64Data && base64Data.length <= MAX_DRAFT_BASE64_BYTES
        ? base64Data
        : undefined,
  };
}

export function formatIstDateTime(dateString: string): string {
  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}
