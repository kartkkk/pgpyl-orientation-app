import type { ImportantContact } from "@/types";

const CONTACTS_DATA_PATH = "/data/important-contacts.json";

type ImportantContactStaticRow = Omit<ImportantContact, "id">;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown): string | null {
  const normalized = asString(value);
  return normalized.length > 0 ? normalized : null;
}

function asDisplayOrder(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeContactRow(row: unknown, index: number): ImportantContact | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const item = row as Partial<ImportantContactStaticRow>;
  const bodyName = asString(item.body_name);
  const pocName = asString(item.poc_name);

  if (!bodyName || !pocName) {
    return null;
  }

  return {
    id: toContactId(
      {
        body_name: bodyName,
        poc_name: pocName,
        phone_number: asNullableString(item.phone_number),
        email: asNullableString(item.email),
        display_order: asDisplayOrder(item.display_order, index + 1),
      },
      index,
    ),
    body_name: bodyName,
    poc_name: pocName,
    phone_number: asNullableString(item.phone_number),
    email: asNullableString(item.email),
    display_order: asDisplayOrder(item.display_order, index + 1),
  };
}

function toContactId(contact: ImportantContactStaticRow, index: number): string {
  const slug = `${contact.display_order}-${contact.body_name}-${contact.poc_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "contact"}-${index + 1}`;
}

export async function fetchContacts(): Promise<ImportantContact[]> {
  const response = await fetch(CONTACTS_DATA_PATH);

  if (!response.ok) {
    throw new Error("Could not load contacts");
  }

  const payload = (await response.json()) as unknown;
  const rows = Array.isArray(payload) ? payload : [];
  const contacts: ImportantContact[] = [];

  for (const [index, row] of rows.entries()) {
    const normalized = normalizeContactRow(row, index);
    if (normalized) {
      contacts.push(normalized);
    }
  }

  return contacts
    .sort((a, b) => a.display_order - b.display_order || a.body_name.localeCompare(b.body_name));
}
