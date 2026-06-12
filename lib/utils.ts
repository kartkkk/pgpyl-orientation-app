import { format, formatDistanceToNow, parseISO, isAfter, isBefore, differenceInMinutes } from "date-fns";

// ─── Date Formatting ────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), "h:mm a");
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function isUpcoming(dateStr: string): boolean {
  return isAfter(parseISO(dateStr), new Date());
}

export function isPast(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), new Date());
}

export function formatDuration(startsAt: string, endsAt: string | null): string | null {
  if (!endsAt) return null;
  const totalMinutes = differenceInMinutes(parseISO(endsAt), parseISO(startsAt));
  if (totalMinutes <= 0) return null;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}M`;
  if (minutes === 0) return `${hours}H`;
  return `${hours}H ${minutes}M`;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isISBEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@isb.edu");
}

export function isValidPhoneNumber(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

// ─── Error Handling ─────────────────────────────────────────────────────────

/**
 * Maps database constraint errors to user-friendly messages
 */
export function getFriendlyErrorMessage(errorMessage: string): string {
  // Database constraint errors
  if (errorMessage.includes('violates check constraint "ends_after_starts"')) {
    return "Enter a start date and time that's before the end date and time.";
  }

  if (errorMessage.includes('violates check constraint "valid_window"')) {
    return "The end date must be after the start date.";
  }

  if (errorMessage.includes('violates check constraint "exactly_one_target"')) {
    return "Each assignment must target either a section or an individual, not both.";
  }

  if (errorMessage.includes('violates check constraint "one_open_session_per_event"')) {
    return "There's already an open attendance session for this event. Close it first before creating a new one.";
  }

  // Unique constraint errors
  if (errorMessage.includes('duplicate key value violates unique constraint') ||
      errorMessage.includes('violates unique constraint')) {
    if (errorMessage.includes('profiles_email_key')) {
      return "This email address is already registered.";
    }
    if (errorMessage.includes('profiles_roll_number_key')) {
      return "This PG ID is already registered.";
    }
    if (errorMessage.includes('events_ical_uid_key')) {
      return "This event has already been imported from the calendar.";
    }
    if (errorMessage.includes('event_assignments_event_id_section_id_key')) {
      return "This section is already assigned to this event.";
    }
    if (errorMessage.includes('event_assignments_event_id_profile_id_key')) {
      return "This person is already assigned to this event.";
    }
    return "This item already exists.";
  }

  // Foreign key constraint errors
  if (errorMessage.includes('violates foreign key constraint') ||
      errorMessage.includes('violates not-null constraint')) {
    if (errorMessage.includes('created_by')) {
      return "You must be logged in to perform this action.";
    }
    if (errorMessage.includes('section_id')) {
      return "The selected section no longer exists.";
    }
    if (errorMessage.includes('profile_id')) {
      return "The selected person no longer exists.";
    }
    if (errorMessage.includes('event_id')) {
      return "The selected event no longer exists.";
    }
    return "Some required information is missing or no longer available.";
  }

  // Authentication errors
  if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
    return "Your session has expired. Please log in again.";
  }

  // Permission errors
  if (errorMessage.includes('permission denied') ||
      errorMessage.includes('insufficient_privilege')) {
    return "You don't have permission to perform this action.";
  }

  // Return the original message if no mapping found
  return errorMessage;
}

// ─── Misc ───────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
