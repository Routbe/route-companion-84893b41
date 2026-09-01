import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ProfileView } from "@/components/profile/ProfileView";
import { TourAccountStep } from "@/components/tour/TourAccountStep";
import { TourDesignStep } from "@/components/tour/TourDesignStep";
import { TourIntroStep } from "@/components/tour/TourIntroStep";
import { TourProfileStep, type HandleState } from "@/components/tour/TourProfileStep";
import { TourProgress } from "@/components/tour/TourProgress";
import { useI18n } from "@/lib/i18n";
import { notifyError } from "@/lib/notify";
import { checkHandleAvailability } from "@/lib/bootstrap.functions";
import { requestMagicLink } from "@/lib/auth.functions";
import { saveTourDraft } from "@/lib/tour-draft.functions";
import {
  EMPTY_TOUR_DRAFT,
  readLocalTourDraft,
  writeLocalTourDraft,
  type TourDraft,
} from "@/lib/tour-draft";
import { normalizeHandleForStorage } from "@/lib/handle-rules";
import { strictHandleIssue } from "@/lib/handle-validation";
import { DEFAULT_DISPLAY_PREFS } from "@/lib/profile-display";
import { themeOf, type ProfileRecord } from "@/lib/profile";

const LAST_STEP = 3;

/**
 * /tour — de publieke rondleiding. Mobile-first: de stappen staan bovenaan, het
 * voorbeeld eronder, en de vorige/volgende-balk plakt onderaan het scherm.
 * Elke wijziging wordt lokaal bewaard; zodra er een e-mailadres is gaat het
 * concept ook naar de server, zodat een magic link op een ander toestel werkt.
 */
export default function Tour() {
  const { t } = useI18n();
  const [draft, setDraft] = useState<TourDraft>(EMPTY_TOUR_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [handleState, setHandleState] = useState<HandleState>("idle");
  const [handleReason, setHandleReason] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const checkTimer = useRef<number | undefined>(undefined);
  const saveTimer = useRef<number | undefined>(undefined);

  const patch = useCallback((next: Partial<TourDraft>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  }, []);

  // 1. Concept uit deze browser terughalen (nooit tijdens SSR).
  useEffect(() => {
    const local = readLocalTourDraft();
    if (local) setDraft(local);
    setHydrated(true);
  }, []);

  // 2. Autosave: altijd lokaal, en met e-mailadres ook naar de server.
  useEffect(() => {
    if (!hydrated) return;
    writeLocalTourDraft(draft);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return;
    saveTimer.current = window.setTimeout(() => {
      void saveTourDraft({ data: { email: draft.email.trim(), draft } }).catch(() => {
        /* het lokale concept blijft de bron van waarheid */
      });
    }, 800);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [draft, hydrated]);

  // 3. Live handlecheck (debounced) tegen de database.
  const normalized = normalizeHandleForStorage(draft.handle);
  const issue = strictHandleIssue(draft.handle);

  useEffect(() => {
    if (checkTimer.current) window.clearTimeout(checkTimer.current);
    if (!normalized || issue) {
      setHandleState("idle");
      setHandleReason(issue ?? undefined);
      return;
    }
    setHandleState("checking");
    setHandleReason(undefined);
    checkTimer.current = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await checkHandleAvailability({ data: { handle: normalized } });
          setHandleState(res.ok ? "ok" : "taken");
          setHandleReason(res.ok ? undefined : (res.reason ?? undefined));
        } catch {
          setHandleState("error");
        }
      })();
    }, 300);
    return () => {
      if (checkTimer.current) window.clearTimeout(checkTimer.current);
    };
  }, [normalized, issue]);

  const preview: ProfileRecord = useMemo(
    () => ({
      id: "tour-preview",
      username: normalized || "jouwnaam",
      display_name: draft.displayName || t("tour.preview.name"),
      tagline: draft.bio || null,
      avatar_url: null,
      theme: draft.theme,
      card_style: "bordered",
      blocks: [],
      verified: false,
      status: "active",
      display_prefs: { ...DEFAULT_DISPLAY_PREFS, typography: draft.typography },
    }),
    [normalized, draft.displayName, draft.bio, draft.theme, draft.typography, t],
  );

  const steps = [
    t("tour.steps.intro"),
    t("tour.steps.profile"),
    t("tour.steps.design"),
    t("tour.steps.account"),
  ];

  const canContinue = draft.step !== 1 || handleState === "ok";

  const send = useCallback(async () => {
    setSending(true);
    try {
      await saveTourDraft({ data: { email: draft.email.trim(), draft } });
      const res = await requestMagicLink({ data: { email: draft.email.trim() } });
      if (res.ok) setSent(true);
      else notifyError(t("tour.account.error"));
    } catch {
      notifyError(t("tour.account.error"));
    } finally {
      setSending(false);
    }
  }, [draft, t]);

  return (
    <AppLayout
      width="wide"
      title={t("tour.meta.title")}
      description={t("tour.meta.description")}
      crumbs={[{ label: t("tour.meta.crumb") }]}
    >
      <div className="mx-auto w-full max-w-2xl space-y-6 pb-28">
        <TourProgress steps={steps} current={draft.step} />

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
          {draft.step === 0 ? <TourIntroStep /> : null}
          {draft.step === 1 ? (
            <TourProfileStep
              handle={draft.handle}
              displayName={draft.displayName}
              bio={draft.bio}
              state={handleState}
              reason={handleReason}
              onHandle={(value) => patch({ handle: value })}
              onDisplayName={(value) => patch({ displayName: value })}
              onBio={(value) => patch({ bio: value })}
            />
          ) : null}
          {draft.step === 2 ? (
            <TourDesignStep
              theme={draft.theme}
              typography={draft.typography}
              onTheme={(value) => patch({ theme: value })}
              onTypography={(value) => patch({ typography: value })}
            />
          ) : null}
          {draft.step === 3 ? (
            <TourAccountStep
              email={draft.email}
              sending={sending}
              sent={sent}
              handle={normalized}
              onEmail={(value) => patch({ email: value })}
              onSend={() => void send()}
            />
          ) : null}
        </div>

        {/* Voorbeeld: op mobiel onder de stappen, nooit ernaast. */}
        {draft.step > 0 ? (
          <section aria-label={t("tour.preview.label")} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("tour.preview.label")}
            </p>
            <div
              className="overflow-hidden rounded-[2rem] border border-border shadow-lg"
              style={{ background: themeOf(draft.theme)?.bg }}
            >
              <div className="max-h-[60vh] overflow-y-auto">
                <ProfileView profile={preview} free />
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* Sticky navigatiebalk (duimbereik op mobiel). */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            disabled={draft.step === 0}
            onClick={() => patch({ step: Math.max(0, draft.step - 1) })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            {t("tour.nav.back")}
          </Button>
          <Button
            type="button"
            disabled={draft.step === LAST_STEP || !canContinue}
            onClick={() => patch({ step: Math.min(LAST_STEP, draft.step + 1) })}
          >
            {t("tour.nav.next")}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
