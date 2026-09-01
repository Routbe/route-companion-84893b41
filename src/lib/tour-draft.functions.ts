import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/middleware";
import { parseTourDraft, type TourDraft } from "@/lib/tour-draft";

/**
 * Bewaart het rondleiding-concept op e-mailadres, zodat een magic-link login op
 * een ander toestel alle stappen terugvindt. Alleen schrijven is publiek;
 * teruglezen kan uitsluitend de ingelogde eigenaar van dat adres.
 */
export const saveTourDraft = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; draft: unknown }) => input)
  .handler(async ({ data }) => {
    const email = String(data.email ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false as const, reason: "invalid_email" };
    }
    const { upsertTourDraft } = await import("@/lib/tour-draft.server");
    return upsertTourDraft(email, parseTourDraft(data.draft));
  });

/** Haalt het concept van de ingelogde gebruiker op (op basis van sessie-e-mail). */
export const getMyTourDraft = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const email = (context.user?.email ?? "").trim().toLowerCase();
    if (!email) return { draft: null as TourDraft | null };
    const { readTourDraft } = await import("@/lib/tour-draft.server");
    return { draft: await readTourDraft(email) };
  });

/** Ruimt het concept op zodra het profiel echt is aangemaakt. */
export const discardMyTourDraft = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const email = (context.user?.email ?? "").trim().toLowerCase();
    if (email) {
      const { deleteTourDraft } = await import("@/lib/tour-draft.server");
      await deleteTourDraft(email);
    }
    return { ok: true as const };
  });
