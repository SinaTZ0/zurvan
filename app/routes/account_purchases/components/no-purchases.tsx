import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";

/*===== No Purchases =====*/
/**
 * An account that hasn't paid for anything yet: in place of the slips, one large grained plate. Its stage is the empty
 * market stall (dimmed), with the center's dog lying in front of it, a paw on his piggy bank: nothing bought yet. The
 * words and the one gold button sit beside it (on phones, under it).
 *
 * The stage's pieces use physical sides (the dog faces right, towards the words; the bubble's tail is aimed at his
 * head). Motion: the plate rises in with the page, the dog breathes, the bubble pops after it.
 */
export function NoPurchases() {
  return (
    <section
      aria-labelledby="no-purchases-title"
      className="ap-slip grid overflow-hidden rounded-4xl border border-border/60 bg-sunken paper-grain shadow-[0_24px_48px_-28px_rgb(0_0_0/0.9)] [--answer-delay:.45s] lg:grid-cols-12"
    >
      {/*===== Words =====*/}
      <div className="order-2 p-6 sm:p-8 lg:order-1 lg:col-span-6 lg:flex lg:flex-col lg:justify-center lg:p-12">
        <h2 id="no-purchases-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
          {m.account_purchases_none_title()}
        </h2>
        <p className="mt-3 max-w-md text-lead text-pretty text-muted-foreground">{m.account_purchases_none_line()}</p>
        <Link
          to="/courses"
          className={buttonVariants({ variant: "solid", size: "lg", className: "mt-7 w-full sm:w-fit sm:min-w-48" })}
        >
          {m.account_purchases_none_courses()}
        </Link>
      </div>

      {/*===== Stage =====*/}
      <div
        aria-hidden
        className="relative order-1 h-[15rem] [--dog-w:10.5rem] [--ground:0.9rem] sm:h-[16rem] lg:order-2 lg:col-span-6 lg:h-auto lg:min-h-[23rem] lg:[--dog-w:15.5rem] lg:[--ground:1.2rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_58%_at_50%_80%,rgb(255_194_26/0.08),transparent)]" />
        <NightSky className="inset-x-[8%] top-3 h-16 lg:top-8 lg:h-24" />
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />

        {/*------ Pieces ------*/}
        {/* The stall at the far (left) end; the dog lies in front of its crates, towards the words. */}
        <div className="absolute inset-x-0 bottom-(--ground) mx-auto h-full w-[20rem] lg:w-[29rem]">
          <MascotCut
            name="plants"
            className="lively-sway absolute bottom-0 -left-[1rem] w-[3.25rem] translate-y-[6%] lg:-left-[1.5rem] lg:w-[4.75rem]"
          />
          <MascotCut
            name="stall"
            className="absolute bottom-0 left-[0.5rem] w-[10.5rem] translate-y-[6%] lg:w-[16rem]"
          />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute -right-[1.25rem] bottom-0 w-[3rem] translate-y-[6%] -scale-x-100 lg:-right-[1.75rem] lg:w-[4.25rem]"
          />

          {/*------ The Dog With His Piggy Bank ------*/}
          <div className="absolute right-[0.25rem] bottom-0 w-(--dog-w) translate-y-[4%] lg:right-[0.5rem]">
            <MascotCut name="piggy" className="lively-breathe block w-full" />
          </div>

          {/* His head is about 40% of his width in from his right side and near the top of his 280/341 height: the
              tail's centre (2.25rem in from the bubble's right edge) lands over it. */}
          <ChalkBubble
            tail="right"
            className="ap-empty-pop absolute right-[calc(0.25rem+var(--dog-w)*0.4-2.25rem)] bottom-[calc(var(--dog-w)*0.8+0.5rem)] max-w-[12rem] text-pretty lg:right-[calc(0.5rem+var(--dog-w)*0.4-2.25rem)] lg:max-w-[15rem]"
          >
            {m.account_purchases_none_bubble()}
          </ChalkBubble>
        </div>
      </div>
    </section>
  );
}
