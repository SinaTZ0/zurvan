import { cn } from "cn";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { PROFILE_PATH } from "~/lib/account-links";

/*===== Partner Notices =====*/
/**
 * At most two cards above the shop, and only when they are true. Without a Sheba the Admin cannot pay the commission,
 * so that is said first; an inactive partner's link attributes no one, so the only useful step is to call the center.
 */
export function PartnerNotices({
  isActive,
  hasSheba,
  className,
}: {
  isActive: boolean;
  hasSheba: boolean;
  className?: string;
}) {
  if (hasSheba && isActive) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {!hasSheba && (
        <section
          aria-labelledby="partner-sheba-notice"
          className="flex flex-col gap-4 rounded-2xl border border-primary/50 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <h2 id="partner-sheba-notice" className="font-bold text-balance">
            برای دریافت پورسانت، شماره‌ی شبا لازم است.
          </h2>
          <Link to={PROFILE_PATH} className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
            نوشتن شبا
          </Link>
        </section>
      )}

      {!isActive && (
        <section
          aria-labelledby="partner-inactive-notice"
          className="flex flex-col gap-4 rounded-2xl border border-destructive/40 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <h2 id="partner-inactive-notice" className="font-bold text-balance">
            همکاری‌ات فعلاً متوقف است؛ لینک و شماره‌هایت کسی را به نام تو ثبت نمی‌کند. برای شروع دوباره با{" "}
            {HEAD_TRAINER.firstName} تماس بگیر.
          </h2>
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
          </a>
        </section>
      )}
    </div>
  );
}
