import { cn } from "cn";

import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { m } from "~/paraglide/messages";
import { ProfileTag } from "~/routes/account_profile/components/profile-tag";

/*===== Tag Stage =====*/
/**
 * Your own tag on the house's hall stand. A grained stage panel under a faint night sky, a path along its foot with a
 * bush at each end and a pool of warm light; the dimmed hall stand stands on the path at the end side with the dogs'
 * leashes, a collar and a harness on its pegs, and a gold peg screwed into its start-side post holds the person's tag
 * by a ring, so the tag hangs in front of the stand among the leashes. No mascot here: this column is the person's.
 *
 * Drawn with physical sides on purpose: the peg is on the picture's right post, whatever the reading direction. The
 * stand is `--stand` wide; the peg sits at its post's outer edge (86.5% across, 12% down: measured on the picture)
 * and is `--peg` long; the tag hangs from 78% along the peg. Phones: a 16rem band, the stand 13rem wide. From `lg`:
 * a panel as tall as the screen allows (25–34rem), the stand 18rem wide, the extra height all sky; the column is
 * sticky, so at the end of the scroll it still reaches down to the cards' last plate.
 *
 * Motion (page-motion.tsx): on load the tag swings on its peg once and settles (`pf-swing`, around the ring), then
 * keeps a slight sway (`pf-sway`); `swing` (a count) re-keys it, so a saved name swings it again.
 */
export function TagStage({
  initial,
  name,
  roleLabel,
  phoneNumber,
  swing,
  className,
}: {
  initial: string;
  name: string;
  roleLabel: string | null;
  phoneNumber: string | null;
  /** Bumped after a name is saved: the tag swings again. */
  swing: number;
  className?: string;
}) {
  return (
    <aside
      aria-label={m.account_profile_tag_aria()}
      className={cn(
        "relative isolate h-[16rem] overflow-hidden rounded-4xl border border-foreground/10 bg-sunken paper-grain [--ground:0.9rem] [--peg:1.4rem] [--stand:13rem] lg:h-[clamp(25rem,calc(100svh-11rem),34rem)] lg:[--ground:1.2rem] lg:[--peg:1.6rem] lg:[--stand:18rem]",
        className,
      )}
    >
      {/*===== Sky and Light =====*/}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_45%_70%,rgb(255_194_26/0.08),transparent)]"
      />
      <NightSky className="inset-x-[8%] top-3 h-12 opacity-70 lg:top-8 lg:h-[34%]" />

      {/*===== Path =====*/}
      <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />

      {/*===== Scene =====*/}
      {/* A fixed box of pieces on the path: a wider panel only adds room at its ends. */}
      <div className="absolute inset-x-0 bottom-(--ground) mx-auto h-full w-[22rem] lg:w-[26rem]">
        {/*------ Bushes ------*/}
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute bottom-0 -left-[0.75rem] w-[3rem] translate-y-[6%] -scale-x-100 lg:-left-[1rem] lg:w-[4rem]"
        />
        <MascotCut
          name="plants"
          eager
          className="lively-sway absolute -right-[0.5rem] bottom-0 w-[3.75rem] translate-y-[6%] lg:-right-[0.75rem] lg:w-[5rem]"
        />

        {/*------ Hall Stand ------*/}
        {/* Not hidden from assistive tech as a whole: the tag's number inside is real text (the pictures have no alt). */}
        <div className="absolute bottom-0 left-[0.25rem] w-(--stand) translate-y-[5%] lg:left-[0.5rem]">
          <MascotCut name="hall-stand" eager className="block w-full" />

          {/*------ The Peg ------*/}
          {/* A brass peg screwed into the post: a small plate, a rod, its tip turned up so the ring can't slip off. */}
          <div className="absolute top-[12%] left-[86.5%] w-(--peg)">
            <svg aria-hidden viewBox="0 0 40 20" className="block w-full overflow-visible text-primary/85">
              <rect x="0" y="0.5" width="5" height="12" rx="1.6" fill="currentColor" opacity="0.7" />
              <path
                d="M3 6.5H33q4.5 0 4.5-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <circle cx="37.5" cy="2" r="2.4" fill="currentColor" />
            </svg>

            {/*------ The Tag ------*/}
            {/* Hangs from the rod (6.5/20 of the peg's height, 78% along it). The swing turns around the ring's top. */}
            <div className="absolute top-[calc(var(--peg)*0.325)] left-[78%] -translate-x-1/2">
              <div key={swing} className="pf-swing origin-top">
                <div className="pf-sway flex origin-top flex-col items-center">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="relative z-10 -mt-1.5 -mb-[1.2rem] size-7 text-primary lg:-mb-[1.4rem] lg:size-8"
                  >
                    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
                  </svg>
                  <ProfileTag initial={initial} name={name} roleLabel={roleLabel} phoneNumber={phoneNumber} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
