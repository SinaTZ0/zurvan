import { cn } from "cn";

import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Edge Dog =====*/
/**
 * The center's dog on a plate's top edge: a pool of warm light behind him, a bush in front of him, the dimmed piece of
 * scenery that means something on his plate behind him (with a small bush of its own), his idle loop, and his bubble
 * (`children`, placed by the caller against this box). The box is sunk 3% so the cut-out's soft feet disappear into
 * the edge; `className` sets his width (keep it under about 1.3x the cut-out's natural width).
 *
 * He rises from behind the edge when his plate comes into view (`pd-edge`, page-motion.tsx, started by `useInView` on
 * the section); the clip moves with him, so nothing shows below the edge until he is up. The scenery and the bushes
 * don't rise: they were always there.
 *
 * Physical sides on purpose: every dog faces right (the start side in RTL, towards his plate's heading), so the bush in
 * front of him is on his right and the scenery behind him, towards the plate's rounded end corner, on his left.
 */
export function EdgeDog({
  name,
  scenery,
  idle = "lively-breathe",
  className,
  children,
}: {
  name: MascotCutName;
  /** The dimmed piece behind him: `width` a share of his width, `className` its nudges against his box. */
  scenery: { name: MascotCutName; width: string; className?: string };
  /** His idle loop (`lively-*`). */
  idle?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative translate-y-[3%]", className)}>
      {/* A pool of warm light where he stands. */}
      <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Behind Him ------*/}
      <div
        className={cn("absolute right-[72%] bottom-0 translate-y-[3%]", scenery.className)}
        style={{ width: scenery.width }}
      >
        <MascotCut name={scenery.name} className="block w-full" />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute right-[82%] bottom-0 w-[36%] translate-y-[4%] -scale-x-100"
        />
      </div>

      {/*------ In Front ------*/}
      <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[72%] w-[40%]" />

      {/*------ The Dog ------*/}
      {/* The rise on the wrapper, the idle loop on the picture, so one never cancels the other. */}
      <div className="pd-edge relative">
        <MascotCut name={name} className={cn(idle, "block w-full")} />
      </div>

      {children}
    </div>
  );
}
