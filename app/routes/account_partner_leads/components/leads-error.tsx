import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { COLUMN } from "~/routes/account_partner_leads/column";

/*===== Leads Error =====*/
/**
 * What the page shows when it can't read the partner's people, inside the account shell (its header and the partner's
 * tabs stay on screen): the `sorry` dog on a short path between two bushes, ears back. Words at the start, the stage at
 * the end (on phones the stage on top). A partner user with no partner row lands here as not found.
 */
export function LeadsError({ notFound }: { notFound: boolean }) {
  return (
    <section
      aria-labelledby="partner-leads-error-title"
      className={cn(
        COLUMN,
        "grid grid-cols-[minmax(0,1fr)] items-center gap-y-6 pt-section-sm lg:grid-cols-12 lg:gap-x-12",
      )}
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-6">
        <h1 id="partner-leads-error-title" className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>
          {notFound ? "این صفحه پیدا نشد" : "صفحه‌ی شماره‌ها باز نشد"}
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن.
        </p>
        <Link to="/account/partner" className={buttonVariants({ variant: "solid", size: "lg", className: "mt-8" })}>
          برگرد به داشبورد
        </Link>
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
