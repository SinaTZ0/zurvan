import { ChalkBubble } from "~/components/chalk-bubble";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { buttonVariants } from "~/components/ui/button";
import { BRICK } from "~/lib/brick";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";

import { COLUMN } from "../column";

/*===== Next Course Band =====*/
/**
 * «دوره‌ی بعدی؟»: the page's one brick band, full-bleed, and its end (the page sets `flushFooter`). Shown in every state.
 * The heading stands on the paper over the wall at the start side; at the end side the center's dog sits on the coping
 * with a blank price tag in his mouth, a bush either side and a pool of warm light, saying «رفیقم آماده‌ی دوره‌ی بعدیه!».
 * On the wall a dark plate carries the line and the two ways on: gold «خرید دوره» (pick the dog first, `/buy`) and the
 * quieter «همه‌ی دوره‌ها».
 *
 * He rises over the coping as the band scrolls in (`ap-edge-rise`, scroll-driven where the browser can) and breathes.
 * His block overlaps the coping by a few pixels, so the cut-out's soft base disappears into the stone. Physical sides for
 * the bushes and the bubble: tied to the picture (he faces right, towards the heading).
 */
export function NextCourseBand() {
  return (
    <section aria-labelledby="next-course-title" className="mt-section-sm">
      {/*------ Heading and the Dog on the Coping ------*/}
      <div className={`${COLUMN} flex items-end justify-between gap-6 pt-20 sm:pt-12`}>
        <div className="max-w-xl pb-6 lg:pb-8">
          <h2 id="next-course-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
            {m.account_purchases_next_title()}
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">{m.account_purchases_next_line()}</p>
        </div>

        <div aria-hidden className="relative me-2 w-20 shrink-0 translate-y-[3%] sm:me-8 sm:w-24 lg:me-[16rem] lg:w-28">
          {/* Mirrored on the English pages, where he stands at the right end and faces the words. */}
          <div className="relative ltr:-scale-x-100">
            <div className="absolute -inset-x-full -top-1/4 bottom-0 bg-[radial-gradient(ellipse_40%_55%_at_50%_85%,rgb(255_194_26/0.08),transparent)]" />
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[74%] w-[66%]" />
            <MascotCut name="plants" className="lively-sway-2 absolute right-[80%] bottom-0 w-[52%] -scale-x-100" />
            <div className="ap-edge-rise relative">
              <MascotCut name="price-tag" className="lively-breathe block w-full" />
            </div>
          </div>
          {/* His head is about 70% across him; the tail (2.25rem in from the bubble's left edge, the right in English)
              is aimed there. */}
          <ChalkBubble
            tail="end"
            className="lively-reveal-pop absolute bottom-[calc(100%+0.1rem)] left-[calc(70%-2.25rem)] w-max max-w-[11rem] text-pretty sm:max-w-[16rem] ltr:right-[calc(70%-2.25rem)] ltr:left-auto"
          >
            {m.account_purchases_next_bubble()}
          </ChalkBubble>
        </div>
      </div>

      {/*------ The Wall ------*/}
      <div
        style={{ backgroundImage: `var(--grain), ${BRICK}` }}
        className="relative border-t-2 border-t-foreground/60 surface-inverse py-section-sm"
      >
        <div className={COLUMN}>
          <div className="lively-reveal flex flex-col gap-6 rounded-3xl border border-border/50 bg-jet paper-grain p-6 shadow-[0_18px_36px_-18px_rgb(0_0_0/0.9)] sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <p className="max-w-xl text-lead text-pretty">{m.account_purchases_next_lead()}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/buy" className={buttonVariants({ variant: "solid", size: "lg", className: "sm:min-w-44" })}>
                {m.account_purchases_next_buy()}
              </Link>
              <Link to="/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {m.account_purchases_next_all()}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
