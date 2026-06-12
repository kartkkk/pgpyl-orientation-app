type LoadSurface = "events" | "groups" | "alerts" | "students";

const LOAD_ERROR_COPY: Record<LoadSurface, string> = {
  events: "We could not load events right now. Please retry.",
  groups: "We could not load groups right now. Please retry.",
  alerts: "We could not load alerts right now. Please retry.",
  students: "We could not load students right now. Please retry.",
};

const SEARCH_HINT_COPY: Record<LoadSurface, string> = {
  events: "Searching events...",
  groups: "Searching groups...",
  alerts: "Filtering alerts...",
  students: "Searching students...",
};

export const scanCopy = {
  readyTitle: "Ready for code",
  readyBody: "Enter the latest 6-digit attendance code.",
  verifyingTitle: "Checking code",
  verifyingBody: "Please hold still while we verify your attendance.",
  successTitle: "Attendance marked",
  successBody: "You are checked in. You can enter another code if needed.",
  errorTitle: "Could not mark attendance",
  errorBody: "Use the latest 6-digit code and try again.",
} as const;

export function getLoadErrorCopy(surface: LoadSurface): string {
  return LOAD_ERROR_COPY[surface];
}

export function getSearchHintCopy(surface: LoadSurface): string {
  return SEARCH_HINT_COPY[surface];
}

export function getScanErrorBody(error: unknown): string {
  if (!(error instanceof Error)) return scanCopy.errorBody;

  const message = error.message.toLowerCase();
  if (message.includes("already")) {
    return "Attendance is already marked for this session.";
  }

  if (
    message.includes("expired") ||
    message.includes("invalid") ||
    message.includes("closed") ||
    message.includes("not open")
  ) {
    return "This attendance code is no longer active. Ask the organizer for the latest code.";
  }

  return scanCopy.errorBody;
}
