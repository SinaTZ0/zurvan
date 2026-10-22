import { formatTimestamp } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

/*===== Revoked Card =====*/
/**
 * What a revoked certificate says, and nothing more: its number and the day it was revoked. No course, no reason, no
 * seal. The card is muted (the same grain, a red edge at low alpha) so it reads as «no longer», not as an alarm. It
 * rises in on load (`cv-card`), just before the sorry dog settles.
 */
export function RevokedCard({ number, revokedAt }: { number: string; revokedAt: Date }) {
  return (
    <div className="cv-card relative mt-6 max-w-xl rounded-4xl border border-destructive/30 bg-card paper-grain p-6 shadow-[0_24px_50px_-26px_rgb(0_0_0/0.9)] sm:p-8">
      <p className="text-lead text-pretty text-muted-foreground">
        {m.certificate_revoked_before()}{" "}
        <bdi dir="ltr" className="font-mono font-bold tracking-wider text-foreground">
          {number}
        </bdi>{" "}
        {m.certificate_revoked_after({ date: formatTimestamp(revokedAt) })}
      </p>
    </div>
  );
}
