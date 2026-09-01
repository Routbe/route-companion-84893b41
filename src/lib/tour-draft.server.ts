import { sql } from "@/lib/neon";
import { parseTourDraft, type TourDraft } from "@/lib/tour-draft";

let ensured = false;

/**
 * De rondleiding slaat concepten op vóór er een account is, dus de tabel staat
 * los van `profiles` en is gesleuteld op e-mailadres. Ze wordt lui aangemaakt
 * zodat een verse database nooit op een ontbrekende migratie stukloopt.
 */
async function ensureTable() {
  if (ensured) return;
  await sql`
    create table if not exists public.onboarding_drafts (
      email text primary key,
      draft jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
  ensured = true;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function upsertTourDraft(email: string, draft: TourDraft) {
  await ensureTable();
  const address = normalizeEmail(email);
  if (!address.includes("@")) return { ok: false as const, reason: "invalid_email" };
  await sql`
    insert into public.onboarding_drafts (email, draft, updated_at)
    values (${address}, ${JSON.stringify(draft)}::jsonb, now())
    on conflict (email) do update set draft = excluded.draft, updated_at = now()
  `;
  return { ok: true as const };
}

export async function readTourDraft(email: string): Promise<TourDraft | null> {
  await ensureTable();
  const address = normalizeEmail(email);
  if (!address) return null;
  const rows = (await sql`
    select draft from public.onboarding_drafts where email = ${address} limit 1
  `) as { draft: unknown }[];
  const row = rows[0];
  return row ? parseTourDraft(row.draft) : null;
}

export async function deleteTourDraft(email: string) {
  await ensureTable();
  await sql`delete from public.onboarding_drafts where email = ${normalizeEmail(email)}`;
}
