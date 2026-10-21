import { cn } from "cn";
import { PhoneIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { COLUMN } from "~/routes/account_partner/column";

/*===== Partner Error =====*/
/**
 * What the page shows when it can't open, inside the account shell (its header and way back stay on screen): the
 * `sorry` dog, ears back, on a short path between two bushes under the night sky. Words at the start, the stage at the
 * end (on phones the stage on top).
 *
 * A partner user with no `partner` row (`notFound`) gets the call, not a retry: retrying can't create the row. Any other
 * failure gets «دوباره امتحان کن» and the call as the quieter way.
 */
export function PartnerError({ notFound }: { notFound: boolean }) {
  return (
    <section
      aria-labelledby="partner-error-title"
      className={cn(
        COLUMN,
        "grid grid-cols-[minmax(0,1fr)] items-center gap-y-6 pt-section-sm lg:grid-cols-12 lg:gap-x-12",
      )}
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-6">
        <h1 id="partner-error-title" className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>
          {notFound ? "حساب همکاریت کامل نیست" : "صفحه‌ی همکاری باز نشد"}
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          {notFound
            ? "با مرکز تماس بگیر تا حسابت رو کامل کنن."
            : "یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا با مرکز تماس بگیر."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {!notFound && (
            <Link to="/account/partner" className={buttonVariants({ variant: "solid", size: "lg" })}>
              دوباره امتحان کن
            </Link>
          )}
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            className={buttonVariants({ size: "lg", variant: notFound ? "solid" : "outline" })}
          >
            <PhoneIcon aria-hidden className="size-4" />
            <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
          </a>
        </div>
      </div>

      {/*===== Stage =====*/}
      {/* Physical sides: the pieces are tied to the picture (he faces right); the tail is aimed at his head. */}
      <div aria-hidden className="relative order-1 h-56 lg:order-2 lg:col-span-6 lg:h-[22rem]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_50%_at_50%_78%,rgb(255_194_26/0.08),transparent)]" />
        <NightSky className="top-1 left-[6%] h-16 w-[36%] lg:top-4 lg:h-28" />
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
        <div className="absolute bottom-[0.9rem] left-1/2 w-28 -translate-x-1/2 translate-y-[3%] lg:bottom-[1.2rem] lg:w-[13rem]">
          <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[86%] w-[50%]" />
          <MascotCut name="plants" className="lively-sway-2 absolute right-[88%] bottom-0 w-[40%] -scale-x-100" />
          <MascotCut name="sorry" className="lively-breathe relative block w-full" />
          <ChalkBubble
            tail="right"
            className="absolute right-[calc(30%-2.25rem)] bottom-[calc(100%+0.3rem)] text-pretty"
          >
            ببخشید!
          </ChalkBubble>
        </div>
      </div>
    </section>
  );
}
