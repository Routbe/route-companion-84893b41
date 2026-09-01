import type { Typography } from "@/lib/profile-display";

/** Alles wat de publieke rondleiding verzamelt vóór er een account bestaat. */
export type TourDraft = {
  handle: string;
  displayName: string;
  bio: string;
  theme: string;
  typography: Typography;
  email: string;
  step: number;
};

export const EMPTY_TOUR_DRAFT: TourDraft = {
  handle: "",
  displayName: "",
  bio: "",
  theme: "noir",
  typography: "sans",
  email: "",
  step: 0,
};

export const TOUR_DRAFT_KEY = "rout_tour_draft";

const isTypography = (value: unknown): value is Typography =>
  value === "sans" || value === "serif" || value === "mono";

/** Tolerant parser: onbekende of kapotte velden vallen terug op de standaard. */
export function parseTourDraft(input: unknown): TourDraft {
  if (!input || typeof input !== "object") return { ...EMPTY_TOUR_DRAFT };
  const raw = input as Record<string, unknown>;
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : "");
  const step = typeof raw["step"] === "number" ? raw["step"] : 0;
  return {
    handle: str("handle"),
    displayName: str("displayName"),
    bio: str("bio"),
    theme: str("theme") || EMPTY_TOUR_DRAFT.theme,
    typography: isTypography(raw["typography"]) ? raw["typography"] : "sans",
    email: str("email"),
    step: Math.min(Math.max(Math.trunc(step), 0), 3),
  };
}

/** Leest het concept uit deze browser (nooit blokkerend). */
export function readLocalTourDraft(): TourDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOUR_DRAFT_KEY);
    return raw ? parseTourDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeLocalTourDraft(draft: TourDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOUR_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* privémodus zonder storage: het serverconcept vangt dit op */
  }
}

export function clearLocalTourDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOUR_DRAFT_KEY);
  } catch {
    /* niets te doen */
  }
}
