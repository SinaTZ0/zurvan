import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { COLUMN } from "~/routes/assessment/column";

/*===== Assessment Error =====*/
/**
 * What the page shows when it can't open, inside the public shell (its header and tab bar stay): the `sorry` dog on a
 * short path between two bushes under the night sky, words at the start and the way home. On phones the stage is on
 * top, about 12rem.
 *
 * The stage's pieces use physical sides: they are tied to the picture (he faces right, the bubble's tail on his head).
 */
export function AssessmentError({ notFound }: { notFound: boolean }) {
  return (
    <section
      aria-labelledby="assessment-error-title"
      className={cn(
        COLUMN,
        "grid grid-cols-[minmax(0,1fr)] items-center gap-y-6 pt-section-sm lg:grid-cols-12 lg:gap-x-12",
      )}
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-6">
        <h1 id="assessment-error-title" className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>
          {notFound ? "این صفحه پیدا نشد" : "صفحه‌ی ارزیابی باز نشد"}
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن.
        </p>
        <Link to="/" className={buttonVariants({ variant: "solid", size: "lg", className: "mt-8" })}>
          برگرد به صفحه‌ی اصلی
        </Link>
      </div>

      {/*===== Stage =====*/}
      <div aria-hidden className="relative order-1 h-48 lg:order-2 lg:col-span-6 lg:h-[22rem]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_50%_at_50%_78%,rgb(255_194_26/0.08),transparent)]" />
        <NightSky className="top-1 right-[6%] h-20 w-[42%] lg:top-4 lg:h-32" />
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
        <MascotCut
          name="plants"
          className="lively-sway absolute bottom-[0.9rem] left-[18%] w-[13%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[11%]"
        />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute right-[18%] bottom-[0.9rem] w-[10%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-[8%]"
        />
        <div className="absolute bottom-[0.9rem] left-1/2 w-28 -translate-x-1/2 translate-y-[3%] lg:bottom-[1.2rem] lg:w-[13rem]">
          <MascotCut name="sorry" className="lively-breathe block w-full" />
          <ChalkBubble
            tail="left"
            className="answer-pop absolute bottom-[84%] left-[74%] text-pretty [--answer-delay:0.3s] [--pop-origin:1.75rem_100%]"
          >
            ببخشید!
          </ChalkBubble>
        </div>
      </div>
    </section>
  );
}
