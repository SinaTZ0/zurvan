import { cn } from "cn";
import { PhoneIcon } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";

/*===== Partner Ask =====*/
/**
 * The page's closing ask: a raised panel with no dog (the one dog on this page is the hero's). Its only action is the
 * call, because joining starts with a phone call. Copied from the catalogue's closing card rather than shared, since
 * the two pages' asks differ in what they do.
 */
export function PartnerAsk() {
  return (
    <section aria-labelledby="partner-ask-title" className="site-container py-section-sm">
      <div className="rounded-4xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-12">
        <div className="max-w-xl">
          <h2 id="partner-ask-title" className="font-display text-h2 font-black text-balance">
            با مرکز تماس بگیر
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">اسم محلت و شماره‌ی موبایلت رو آماده داشته باش.</p>
        </div>
        <a
          href={`tel:${CENTER_PHONE.tel}`}
          className={cn(
            buttonVariants({ variant: "solid", size: "lg" }),
            "mt-8 w-full shrink-0 lg:mt-0 lg:w-auto lg:min-w-52",
          )}
        >
          <PhoneIcon aria-hidden className="size-4" />
          <span>
            زنگ بزن: <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
          </span>
        </a>
      </div>
    </section>
  );
}
