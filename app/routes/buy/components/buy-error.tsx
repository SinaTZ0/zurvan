import { useLocation } from "@tanstack/react-router";
import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { COLUMN, STRIP_FADE } from "~/routes/buy/plate";
import { m } from "~/paraglide/messages";

/*===== Buy Error =====*/
/**
 * What the page shows when it can't open, inside the public shell (its header and the way back stay on screen): the
 * sorry dog on a short path, the words at the start, «دوباره امتحان کن» reloading the same address (the dog included)
 * and «دوره‌ها» as the quieter way on. On phones the little scene is a band on top.
 *
 * The route's `staticData` drops the shell's bottom padding (the page ends on its path), so this carries its own.
 */
export function BuyError({ notFound }: { notFound: boolean }) {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section
      aria-labelledby="buy-error-title"
      className={cn(
        COLUMN,
        "grid grid-cols-[minmax(0,1fr)] items-center gap-y-6 pt-section-sm pb-section-md lg:grid-cols-12 lg:gap-x-12",
      )}
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-6">
        <h1 id="buy-error-title" className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>
          {notFound ? m.buy_error_not_found() : m.buy_error_failed()}
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">{m.buy_error_text()}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={href} className={buttonVariants({ variant: "solid", size: "lg" })}>
            {m.buy_error_retry()}
          </a>
          <Link to="/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {m.buy_error_courses()}
          </Link>
        </div>
      </div>

      {/*===== Stage =====*/}
      {/* Physical sides: the pieces are tied to the picture (he faces right); the tail is aimed at his head. */}
      <div aria-hidden className="relative order-1 h-52 lg:order-2 lg:col-span-6 lg:h-[22rem]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_50%_at_50%_78%,rgb(255_194_26/0.08),transparent)]" />
        <NightSky className="top-1 right-[6%] h-16 w-[42%] lg:top-4 lg:h-28" />
        <GroundStrip className={cn("absolute inset-x-0 bottom-0 h-7 lg:h-9", STRIP_FADE)} />
        <div className="absolute bottom-[0.9rem] left-1/2 w-28 -translate-x-1/2 translate-y-[3%] lg:bottom-[1.2rem] lg:w-[13rem]">
          <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[82%] w-[55%]" />
          <MascotCut name="plants" className="lively-sway-2 absolute right-[86%] bottom-0 w-[42%] -scale-x-100" />
          <MascotCut name="sorry" className="lively-breathe relative block w-full" />
          <ChalkBubble
            tail="right"
            className="absolute right-[calc(30%-2.25rem)] bottom-[calc(100%+0.4rem)] text-pretty"
          >
            {m.buy_error_bubble()}
          </ChalkBubble>
        </div>
      </div>
    </section>
  );
}
