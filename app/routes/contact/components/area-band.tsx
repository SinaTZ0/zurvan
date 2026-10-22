import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { CENTER } from "~/lib/contact";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";
import { COLUMN } from "~/routes/contact/column";

/*===== Help Line =====*/
/** The pointer to the help page, on a small plate; the think dog stands beside (desktop) or on it (phones). */
function HelpLine({ className }: { className?: string }) {
  return (
    <p
      className={`rounded-2xl border border-border bg-jet paper-grain px-5 py-4 text-pretty text-foreground/90 shadow-[0_18px_36px_-18px_rgb(0_0_0/0.9)] ${className ?? ""}`}
    >
      {m.contact_help_before()}
      <Link
        to="/help"
        className="rounded-sm font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {m.contact_help_link()}
      </Link>
      {m.contact_help_after()}
    </p>
  );
}

/*===== Area Band =====*/
/**
 * The page's last band, which runs into the footer (the route's `staticData`): the service area under the Tehran skyline,
 * on a long path. The companion dog trots with his leash in front of the skyline, and the think dog wonders beside the
 * line that points to the help page.
 *
 * The skyline picture has the Milad tower at 86% of its width. Wide screens show the whole picture; on phones it is
 * bigger than the screen and is shifted so the tower stays in view (physical `left`, because the shift is tied to
 * the picture's own geometry, not to the reading direction).
 */
export function AreaBand() {
  return (
    <section aria-labelledby="area-title" className="relative pt-section-sm">
      <NightSky className="top-[6.5rem] left-3 h-12 w-[28%] lg:top-10 lg:left-[12%] lg:h-32 lg:w-[30%]" />

      <div className={`${COLUMN} relative`}>
        <h2 id="area-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
          {m.contact_area_title({ area: CENTER.serviceArea })}
        </h2>
      </div>

      {/*===== Stage =====*/}
      {/* Full width below lg (so the skyline runs off the screen's edges), the column from lg up. */}
      <div className={`${COLUMN} relative mt-4 max-lg:px-0 lg:mt-2`}>
        <div className="relative h-[17rem] overflow-x-clip lg:h-[20rem] lg:overflow-visible">
          {/*------ Skyline ------*/}
          {/* From lg it takes the start 68% of the stage (about its own width), leaving the end for the help sign. */}
          <MascotCut
            name="tehran"
            className="absolute bottom-9 left-[calc(66%-468px)] w-[34rem] [mask-image:linear-gradient(to_right,transparent_2%,black_22%,black_78%,transparent_98%)] lg:start-0 lg:bottom-12 lg:left-auto lg:w-[68%]"
          />

          {/*------ Path ------*/}
          <GroundStrip className="absolute inset-x-0 bottom-0 h-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:inset-x-auto lg:left-1/2 lg:h-14 lg:w-screen lg:-translate-x-1/2" />

          {/*------ Companion ------*/}
          {/* In front of the skyline, left of the tower, so his bubble doesn't cover it. He faces the screen's right, so
              on phones he stands at the left with the bubble in front of him (physical sides, tied to the picture);
              from lg he stands left of the tower and the bubble opens behind him. */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-4 left-5 w-28 lg:start-[14%] lg:ltr:start-[27%] lg:bottom-5 lg:left-auto lg:w-40"
          >
            <div className="absolute -inset-x-[60%] bottom-0 h-[120%] bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.08),transparent)]" />
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[80%] hidden w-[56%] lg:block" />
            <MascotCut name="course-companion" className="lively-breathe relative block w-full" />
            <ChalkBubble
              tail="left"
              className="absolute bottom-[72%] left-[86%] w-max max-w-[8.5rem] text-pretty lg:hidden"
            >
              {m.contact_area_bubble()}
            </ChalkBubble>
            <ChalkBubble
              tail="right"
              className="absolute right-[88%] bottom-[70%] hidden w-max max-w-[14rem] text-pretty lg:block"
            >
              {m.contact_area_bubble()}
            </ChalkBubble>
          </div>

          {/*------ Help Line and the Think Dog (wide screens) ------*/}
          {/* The dog stands at the sign's start corner, looking toward it. */}
          <div className="absolute end-0 bottom-5 hidden w-[26%] min-w-[17rem] lg:block">
            <HelpLine className="ms-auto me-0 mb-3 w-[calc(100%-4.5rem)] min-w-0 ltr:ps-10" />
            <div aria-hidden className="pointer-events-none absolute start-0 bottom-0 w-[4.75rem]">
              <MascotCut name="plants" className="lively-sway-2 absolute bottom-0 left-[60%] w-[80%]" />
              <MascotCut name="think" className="lively-tilt relative block w-full" />
            </div>
          </div>
        </div>
      </div>

      {/*------ Help Line and the Think Dog (phones, tablets) ------*/}
      <div className={`${COLUMN} relative pt-24 pb-10 lg:hidden`}>
        <div aria-hidden className="pointer-events-none absolute inset-x-4 top-0 flex h-24 items-end ps-6 md:inset-x-8">
          <div className="relative w-16 translate-y-[2%]">
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[80%] w-[90%]" />
            <MascotCut name="think" className="lively-tilt relative block w-full" />
          </div>
        </div>
        <HelpLine />
      </div>
    </section>
  );
}
