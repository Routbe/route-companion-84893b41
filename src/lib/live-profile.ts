import { canonicalHandle } from "@/lib/profile-url";

/**
 * Eén bron van waarheid voor "Bekijk live profiel".
 *
 * Een account heeft maximaal twee publieke adressen:
 *   • het geverifieerde rootprofiel  → rout.be/<rootnaam>
 *   • het gratis aliasprofiel        → rout.be/u/<alias>
 *
 * De rootnaam is pas een echt adres wanneer de claim `active` is (DNS is
 * gepropageerd) én het account geverifieerd is. In alle andere gevallen valt
 * de live-link terug op `/u/<alias>`. Componenten mogen dit nooit zelf
 * afleiden uit lokaal opgeslagen state (identity-space in localStorage):
 * daardoor wees de knop naar een adres dat nog niet bestond.
 */

export type LiveProfileInput = {
  /** `profiles.username` — de geverifieerde rootnaam. */
  username?: string | null;
  /** `profiles.subdomain_alias` — de geclaimde rootnaam (mag afwijken van username). */
  subdomainAlias?: string | null;
  /** `profiles.root_subdomain_status` — 'none' | 'pending_dns' | 'active'. */
  rootStatus?: string | null;
  /** `alias_profiles.handle` — het gratis aliasprofiel. */
  aliasHandle?: string | null;
  verified?: boolean | null;
};

export type LiveProfileKind = "root" | "alias" | "none";

export type LiveProfile = {
  kind: LiveProfileKind;
  /** De handle waar het adres op uitkomt, zonder `@`. */
  handle: string | null;
  /** Pad binnen rout.be, bv. `/jona` of `/u/jona50`. */
  path: string | null;
  /** Volledige URL, bv. `https://rout.be/u/jona50`. */
  url: string | null;
  /** Leesbaar label zonder scheme, bv. `rout.be/u/jona50`. */
  label: string | null;
};

const clean = (value: string | null | undefined): string | null => {
  const handle = canonicalHandle(String(value ?? ""));
  return handle ? handle : null;
};

/** Is de rootnaam echt bereikbaar (geclaimd, geverifieerd én DNS actief)? */
export function hasActiveRoot(input: LiveProfileInput): boolean {
  const root = clean(input.subdomainAlias) ?? clean(input.username);
  return Boolean(root) && input.rootStatus === "active" && Boolean(input.verified);
}

export function resolveLiveProfile(
  input: LiveProfileInput,
  origin = "https://rout.be",
): LiveProfile {
  const base = origin.replace(/\/$/, "");
  const domain = base.replace(/^https?:\/\//, "");

  const root = clean(input.subdomainAlias) ?? clean(input.username);
  const alias = clean(input.aliasHandle) ?? clean(input.username);

  const build = (kind: Exclude<LiveProfileKind, "none">, handle: string): LiveProfile => {
    const path = kind === "root" ? `/${handle}` : `/u/${handle}`;
    return { kind, handle, path, url: `${base}${path}`, label: `${domain}${path}` };
  };

  if (root && hasActiveRoot(input)) return build("root", root);
  if (alias) return build("alias", alias);
  return { kind: "none", handle: null, path: null, url: null, label: null };
}
