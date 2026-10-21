import { cn } from "cn";

import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Edge Dog =====*/
/**
 * The center's dog on a plate's top edge: a pool of warm light behind him, a bush in front, behind him the dimmed piece
 * of scenery that means something on his plate (the customer's door by the form, the noticeboard by the list), his idle
 * loop, and his bubble (`children`, placed by the caller against this box). The box is sunk 3% so the cut-out's soft
 * feet disappear into the edge; `className` sets his width (keep it under about 1.3x the cut-out's natural width).
 *
 * He rises from behind the edge as his plate scrolls in (`pl-edge`, page-motion.tsx); the clip moves with him, so
 * nothing shows below the edge until he is up. The scenery and the bush don't rise: they were always there.
 *
 * Physical sides on purpose: every dog faces right (the start side in RTL, towards his plate's heading), so the bush in
 * front of him is on his right and the scenery behind him, towards the plate's rounded end corner, on his left.
 */
export function EdgeDog({
  name,
  className,
  idle = "lively-breathe",
  scenery,
  wide = false,
  children,
}: {
  name: MascotCutName;
  className?: string;
  /** His idle loop (`lively-*`). */
  idle?: string;
  /** The dimmed piece behind him, with its size and place against his box. */
  scenery: { name: MascotCutName; className: string };
  /** A lying pose, much wider than tall: the bush is sized to his height, not his width. */
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative translate-y-[3%]", className)}>
      {/* A pool of warm light where he stands. */}
      <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Behind Him ------*/}
      <MascotCut name={scenery.name} className={cn("absolute bottom-0", scenery.className)} />

      {/*------ In Front ------*/}
      <MascotCut
        name="plants"
        className={cn("lively-sway absolute bottom-0", wide ? "left-[90%] w-[26%]" : "left-[70%] w-[46%]")}
      />

      {/*------ The Dog ------*/}
      {/* The rise on the wrapper, the idle loop on the picture, so one never cancels the other. */}
      <div className="pl-edge relative">
        <div className="lively-pet">
          <MascotCut name={name} className={cn(idle, "block w-full")} />
        </div>
      </div>

      {children}
    </div>
  );
}
