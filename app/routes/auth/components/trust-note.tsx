import { ShieldCheckIcon } from "lucide-react";

import { Link } from "~/components/link";

/*===== Trust Note =====*/
/**
 * Privacy reassurance under the sign-in form: a hairline-topped line with a small gold shield, no box. It says what the
 * number is for and, in one sentence, what a partner who brought the person can see (the owner asked for the partner
 * referral to be explained at sign-up, 2026-10-19). It used to promise «به هیچ‌کس نمی‌دهیم», which is not true of the
 * partner who typed the number as a lead, so it points at the privacy page's «کی چی رو می‌بینه» instead.
 */
export function TrustNote() {
  return (
    <aside className="flex items-start gap-3 border-t border-border pt-5">
      <ShieldCheckIcon className="mt-1 size-5 shrink-0 text-primary" strokeWidth={1.7} aria-hidden />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold">شماره‌ات را فقط برای کار با تو نگه می‌داریم.</p>
        <p className="text-xs text-pretty text-muted-foreground">
          برای ورود و پیامک‌های آموزش سگت. اگر همکاری تو را آورده باشد، فقط می‌بیند که ثبت‌نام و خرید کرده‌ای.{" "}
          <Link
            to="/privacy#who-sees"
            className="rounded-sm font-bold text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            کی چی را می‌بیند
          </Link>
        </p>
      </div>
    </aside>
  );
}
