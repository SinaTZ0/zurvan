import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MASCOT_CUTS, MascotCut, type MascotCutName } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { STRIP_FADE } from "~/routes/buy/plate";

/*===== Types =====*/
/** Sizes in rem for phones and from `lg`. */
type Pair = readonly [phone: number, lg: number];

export type SceneSpec = {
  /** The width of the box the pieces are placed in. */
  box: Pair;
  scenery: { name: MascotCutName; width: Pair; left: Pair };
  dog: {
    name: MascotCutName;
    height: Pair;
    left: Pair;
    /** How far across the picture his head is (0–1), for the bubble's tail. */
    head: number;
  };
  bubble: string | null;
};

/*===== Scene Stage =====*/
/**
 * A little scene inside a panel: a dimmed piece of scenery and the center's dog in front of it on a short path, a bush
 * either side, a pool of warm light, a night sky and his bubble over his head. The pieces stand in a fixed box at the
 * stage's bottom, so a taller panel only adds sky.
 *
 * Physical sides: the pieces are tied to the pictures (he faces right, towards the words), and the bubble's tail (1.75rem
 * in from its right edge) is aimed at his head: its right edge is the box width minus his head's x minus 2.25rem. The
 * sizes go in as custom properties so one set of classes serves every scene.
 *
 * Motion: he rises out of the path (`by-edge-rise`, tied to the scroll where the browser can), breathes, and his bubble
 * pops as it scrolls in (`lively-reveal-pop`).
 */
export function SceneStage({ spec, className }: { spec: SceneSpec; className?: string }) {
  const { width, height } = MASCOT_CUTS[spec.dog.name];
  const vars = {
    "--box-p": `${spec.box[0]}rem`,
    "--box-l": `${spec.box[1]}rem`,
    "--sc-w-p": `${spec.scenery.width[0]}rem`,
    "--sc-w-l": `${spec.scenery.width[1]}rem`,
    "--sc-l-p": `${spec.scenery.left[0]}rem`,
    "--sc-l-l": `${spec.scenery.left[1]}rem`,
    "--dog-h-p": `${spec.dog.height[0]}rem`,
    "--dog-h-l": `${spec.dog.height[1]}rem`,
    "--dog-l-p": `${spec.dog.left[0]}rem`,
    "--dog-l-l": `${spec.dog.left[1]}rem`,
    "--head": String((width / height) * spec.dog.head),
  } as React.CSSProperties;

  return (
    <div
      aria-hidden
      style={vars}
      className={cn(
        "pointer-events-none relative [--box:var(--box-p)] [--dog-h:var(--dog-h-p)] [--dog-l:var(--dog-l-p)] [--sc-l:var(--sc-l-p)] [--sc-w:var(--sc-w-p)] lg:[--box:var(--box-l)] lg:[--dog-h:var(--dog-h-l)] lg:[--dog-l:var(--dog-l-l)] lg:[--sc-l:var(--sc-l-l)] lg:[--sc-w:var(--sc-w-l)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_58%_at_50%_82%,rgb(255_194_26/0.08),transparent)]" />
      <NightSky className="inset-x-[10%] top-3 h-16 lg:top-6 lg:h-24" />
      <GroundStrip className={cn("absolute inset-x-0 bottom-0 h-7 lg:h-9", STRIP_FADE)} />

      {/*------ Pieces ------*/}
      <div className="absolute inset-x-0 bottom-[0.9rem] mx-auto h-full w-(--box) lg:bottom-[1.2rem]">
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute bottom-0 -left-[1rem] w-[3rem] translate-y-[6%] -scale-x-100 lg:-left-[1.5rem] lg:w-[4.25rem]"
        />
        {/* `MascotCut` dims most scenery itself, not the chalkboard (it can carry chalk): here it is only scenery. */}
        <MascotCut
          name={spec.scenery.name}
          className="absolute bottom-0 left-(--sc-l) w-(--sc-w) translate-y-[5%] scenery-dim"
        />
        <MascotCut
          name="plants"
          className="lively-sway absolute -right-[1.25rem] bottom-0 w-[3.5rem] translate-y-[6%] lg:-right-[1.75rem] lg:w-[5rem]"
        />

        {/*------ The Dog ------*/}
        <div className="by-edge-rise absolute bottom-0 left-(--dog-l) h-(--dog-h) translate-y-[3%]">
          <MascotCut name={spec.dog.name} className="lively-breathe block h-full w-auto" />
        </div>

        {/*------ Bubble ------*/}
        {spec.bubble && (
          <div className="absolute right-[calc(var(--box)-var(--dog-l)-var(--dog-h)*var(--head)-2.25rem)] bottom-[calc(var(--dog-h)+0.4rem)] flex w-[13rem] justify-start lg:w-[16rem]">
            <ChalkBubble tail="right" className="lively-reveal-pop text-pretty">
              {spec.bubble}
            </ChalkBubble>
          </div>
        )}
      </div>
    </div>
  );
}
