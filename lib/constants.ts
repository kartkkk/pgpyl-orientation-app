import type { SectionCode } from "@/types";

// ─── Section Metadata ───────────────────────────────────────────────────────

export interface SectionMeta {
    code: SectionCode;
    name: string;
    mascot: string;
    color: string;
    light: string;
    emoji: string;
}

export const SECTIONS: Record<SectionCode, SectionMeta> = {
    A: { code: "A", name: "Section A", mascot: "Section A", color: "#4F46E5", light: "#E0E7FF", emoji: "🅰️" },
    B: { code: "B", name: "Section B", mascot: "Section B", color: "#0D9488", light: "#CCFBF1", emoji: "🅱️" },
};

export const SECTION_CODES: SectionCode[] = ["A", "B"];

// ─── Hardcoded Admin Emails (used for mock auth; overridden by DB in production) ──

export const INITIAL_ADMIN_EMAILS: string[] = [
    // Add your admin emails here
    // "admin@isb.edu",
];

// ─── App Config ─────────────────────────────────────────────────────────────

export const APP_NAME = "PGP YL O-Week";

export const QR_ROTATION_INTERVAL_MS = 60_000; // 60 seconds

export const NOTIFICATION_BATCH_SIZE = 100;
