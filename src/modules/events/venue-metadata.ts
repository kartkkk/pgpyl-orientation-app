export interface VenueDetails {
  name: string;
  mapUrl: string;
  directions?: string;
  aliases?: readonly string[];
}

export const VENUE_DETAILS: readonly VenueDetails[] = [
  {
    name: "Khemka Auditorium",
    mapUrl: "https://maps.app.goo.gl/Ue72AA57Ay8qCCXL6",
    directions:
      "1st Floor, Complete opposite of the main reception/one floor directly above Goel's",
    aliases: ["Khemka Auditorium"],
  },
  {
    name: "Atrium",
    mapUrl: "https://maps.app.goo.gl/phw2tZ64yUW8RGMp9",
    directions: "Courtyard (C) floor, in the centre of the floor",
  },
  {
    name: "AC2LT",
    mapUrl: "https://maps.app.goo.gl/SeAxRg7oy9MUZbpY8",
    directions: "2nd floor of the Academic Centre (AC)",
  },
  {
    name: "AC4LT",
    mapUrl: "https://maps.app.goo.gl/fRgNr9rZEsufUxu89",
    directions: "2nd floor of the Academic Centre (AC)",
  },
  {
    name: "AC6LT",
    mapUrl: "https://maps.app.goo.gl/DFWEJwzgvGpA1RAV8",
    directions: "2nd floor of the Academic Centre (AC)",
  },
  {
    name: "AC8LT",
    mapUrl: "https://maps.app.goo.gl/wuJX9CxndN3KBQEy9",
    directions: "2nd floor of the Academic Centre (AC)",
  },
  {
    name: "Madras Filter Coffee",
    mapUrl: "https://maps.app.goo.gl/2669WeeY2wkrveud8",
    directions: "Next to the entrance of SV4",
    aliases: ["Madras Filter Coffee (MFC)"],
  },
  {
    name: "Goel's Dining Hall",
    mapUrl: "https://maps.app.goo.gl/UPuaqPjfFtcRtiWi8",
    directions: "Courtyard (C) floor, below Khemka Auditorium",
    aliases: ["Goel's Cafe"],
  },
  {
    name: "Sports Fields",
    mapUrl: "https://maps.app.goo.gl/ge2rtQAh2GRXYAzq6",
    directions: "Near the Recreation Centre",
  },
  {
    name: "Recreation Centre",
    mapUrl: "https://maps.app.goo.gl/YzmizKEZEm27x8hY9",
  },
  {
    name: "Recreation Centre Lawns",
    mapUrl: "https://maps.app.goo.gl/ETXzdhefcwW4mJ688",
  },
  {
    name: "Motilal Oswal Executive Centre",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Motilal+Oswal+Executive+Centre+ISB+Hyderabad",
    directions: "MOEC, Level 1 — registration desks (ASA, Admissions & Finance)",
    aliases: ["MOEC", "Motilal Oswal Executive Centre (MOEC)"],
  },
  {
    name: "Lecture Theatre 3 (LT3)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Lecture+Theatre+ISB+Hyderabad",
    directions: "LT3, Level 1, Motilal Oswal Executive Centre",
    aliases: ["LT3", "Lecture Theatre 3", "Lecture Theatre (LT) 3"],
  },
  {
    name: "Ramoji Auditorium",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Ramoji+Auditorium+ISB+Hyderabad",
    directions: "RA — Ramoji Auditorium",
    aliases: ["RA", "Ramoji"],
  },
  {
    name: "Student Dining Room",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Student+Dining+Room+ISB+Hyderabad",
    directions: "AC5 Courtyard",
    aliases: ["SDR", "Dining Hall"],
  },
] as const;

export const PRESET_VENUES = VENUE_DETAILS.map((venue) => venue.name);

function normalizeVenueKey(value: string): string {
  return value.trim().toLowerCase();
}

const VENUE_DETAILS_BY_KEY = new Map<string, VenueDetails>();

for (const venue of VENUE_DETAILS) {
  VENUE_DETAILS_BY_KEY.set(normalizeVenueKey(venue.name), venue);

  for (const alias of venue.aliases ?? []) {
    VENUE_DETAILS_BY_KEY.set(normalizeVenueKey(alias), venue);
  }
}

export function getVenueDetails(venue?: string | null): VenueDetails | null {
  if (!venue?.trim()) return null;
  return VENUE_DETAILS_BY_KEY.get(normalizeVenueKey(venue)) ?? null;
}

export function canonicalizeVenueName(venue?: string | null): string | null {
  if (!venue?.trim()) return null;
  return getVenueDetails(venue)?.name ?? venue.trim();
}
