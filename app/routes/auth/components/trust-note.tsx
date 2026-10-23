import { ShieldCheckIcon } from "lucide-react";

import { Link } from "~/components/link";
import { m } from "~/paraglide/messages";

/*===== Trust Note =====*/
/**
 * Privacy reassurance under the plate: a small gold shield and two lines on the paper, no box. It says what the number is
 * for and, in one sentence, what a partner who brought the person can see (the owner asked for the partner referral to
 * be explained at sign-up, 2026-10-19). It used to promise «به هیچ‌کس نمی‌دیم», which is not true of the partner who typed
 * the number as a lead, so it points at the privacy page's «کی چی رو می‌بینه» instead.
 */
export function TrustNote() {
  return (
    <aside className="flex items-start gap-3 px-1">
      <ShieldCheckIcon className="mt-1 size-5 shrink-0 text-primary" strokeWidth={1.7} aria-hidden />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold">{m.auth_trust_title()}</p>
        <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
          {m.auth_trust_body()}{" "}
          <Link
            to="/privacy"
            hash="who-sees"
            className="rounded-sm font-bold text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {m.auth_trust_link()}
          </Link>
        </p>
      </div>
    </aside>
  );
}
