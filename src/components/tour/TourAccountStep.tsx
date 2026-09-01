import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

/** Stap 3: e-mailadres → magic link. Het concept reist mee naar het account. */
export function TourAccountStep({
  email,
  sending,
  sent,
  handle,
  onEmail,
  onSend,
}: {
  email: string;
  sending: boolean;
  sent: boolean;
  handle: string;
  onEmail: (value: string) => void;
  onSend: () => void;
}) {
  const { t } = useI18n();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t("tour.account.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("tour.account.body")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="text-muted-foreground">{t("tour.account.summary")}</p>
        <p className="mt-1 font-medium">rout.be/{handle || "jouwnaam"}</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !sending) onSend();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="tour-email">{t("tour.account.emailLabel")}</Label>
          <Input
            id="tour-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="jij@voorbeeld.be"
            className="h-12"
          />
        </div>

        <Button type="submit" className="h-12 w-full" disabled={!valid || sending}>
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          {t("tour.account.send")}
        </Button>
      </form>

      {sent ? (
        <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t("tour.account.sent")}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">{t("tour.account.privacy")}</p>
    </div>
  );
}
