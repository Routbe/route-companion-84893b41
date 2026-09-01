# ROUT roadmap

## Refactor pass (component decomposition & tech debt)

- [ ] Split `src/pages/Admin.tsx` into `src/components/admin/` (AdminUserTable, AdminVerificationQueue, AdminAnalyticsSummary, AdminSettings)
- [ ] Split `src/components/dashboard/ProfileEditor.tsx` into `src/components/dashboard/editor/` (ProfileBasicInfoForm, ProfileLinksManager, ProfileThemePicker, ProfileHeaderPreview)
- [ ] Flatten `src/pages/routes/*` into `src/routes/*` (remove 16 wrapper files)
- [ ] Fix 50x `react-refresh/only-export-components` (move helpers/constants/types to `src/lib` / `src/types`)
- [ ] Fix 5x `react-hooks/exhaustive-deps` (QRPreview, QRInputFields, Index)
- [ ] Replace `any` in server/API functions with strict types
- [ ] Verify: 293 tests pass + `tsgo --noEmit` clean
- [ ] Keep /tmp/observability/build-errors.log clean (typecheck must pass before finishing)

## Rondleiding (/tour)
- [x] TourDesignStep + TourAccountStep
- [x] src/pages/Tour.tsx + src/routes/tour.tsx (mobile-first, sticky nav, autosave)
- [x] tour.* vertaalsleutels in nl/en/fr/de
- [x] CTA "Start de rondleiding" op About + startpagina
- [x] Onboarding voorvullen uit concept + concept opruimen
- [ ] Rondleiding op mobiel testen

## Open werk (nieuw gemeld)
- [x] Studio-preview: vaste framemaat (krimpt niet meer bij weinig tekst) + echt 390px telefoonviewport
- [x] Studio-preview matcht de publieke route (alias `/u/<handle>` toont mens-badge "Gekoppeld aan een geverifieerd account")
- [ ] Hub-instellingen gratis account: dubbele "Identiteit, URL & badge" naast de profielkeuze bovenaan verwijderen
- [ ] Splits "Identiteitsverificatie & ROUT Badges"; badges verplaatsen naar "Links & components"
- [ ] Meer Pagina Bezoek Effects toevoegen
- [x] Verified-badge (hand-met-keurmerk) tonen op u/-pagina van verified leden, per lid uitschakelbaar (schakelaars in de studio)
- [ ] Mens-badge-tekst volledig meertalig maken (nl/en/fr/de, fallback Engels)
- [x] Badgeverzameling toont eigen vorm + logo per badge (BadgeMedallion) en werkt publiek
- [ ] Verified accounts: hun publieke pagina wordt niet echt aangemaakt — onderzoeken en fixen
- [ ] Routeplanner met kaart
- [ ] Admin-herbedraden voltooien

## Profielhub-naamruimte (gedaan)
- [x] Eén gedeelde handle-naamruimte (root, alias, root-domein) — src/lib/handle-namespace.server.ts + db/39
- [x] /u/<handle> valt niet meer terug op andermans rootprofiel
- [x] /api/claim-root weigert namen van andere accounts
- [x] Domeinenpaneel: expliciet "extra webadres, geen derde profiel"
- [ ] Later: e-mailalias (alias_status/alias_sync_*) in admin hernoemen naar "E-mailalias" om verwarring met profielalias te vermijden

## Neon & rootprofiel (nieuw gemeld 31-08)
- [x] Naamwijziging/claim van geverifieerde naam wordt in één transactie in Neon opgeslagen (username + subdomain_alias + status)
- [x] "Bekijk live profiel" komt uit één bron (src/lib/live-profile.ts)
- [ ] rout.be/<voornaam.achternaam> bestaat niet na claim: rootprofielpagina echt aanmaken
- [x] Root-claim + domeinenpaneel meertalig (root.* in nl/en/fr/de)
- [x] Bezoekerspaneel: bezoeken, in tijd, per taal, bezoekenlijst (VisitorPanel + db/40)
- [x] Hub/Studio-analytics: bezoekerslijst van je u/-pagina met tijd en taal
