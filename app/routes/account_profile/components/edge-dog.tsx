import { cn } from "cn";

import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Edge Dog =====*/
/**
 * The center's dog on a card's top edge: a pool of warm light behind him, a bush in front, behind him either a smaller
 * bush or the dimmed piece of scenery that means something on his card (the front door by the password, the safe by
 * the Sheba), his idle loop, and his bubble (`children`, placed by the caller against this box). The box is sunk 3% so
 * the cut-out's soft feet disappear into the edge; `className` sets his width (keep it under about 1.3x the cut-out's
 * natural width).
 *
 * He rises from behind the edge as his card scrolls in (`pf-rise`, page-motion.tsx); the clip moves with him, so
 * nothing shows below the edge until he is up. The scenery and the bushes don't rise: they were always there.
 *
 * Physical sides on purpose: every dog faces right (the start side in RTL, towards his card's heading), so the bush in
 * front of him is on his right and the scenery behind him, towards the card's rounded end corner, on his left.
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
  /** The dimmed piece behind him, with its size and place against his box. Without it, a small bush stands there. */
  scenery?: { name: MascotCutName; className: string };
  /** A lying pose, much wider than tall: the bushes are sized to his height, not his width. */
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative translate-y-[3%]", className)}>
      {/* A pool of warm light where he stands. */}
      <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Behind Him ------*/}
      {scenery ? (
        <MascotCut name={scenery.name} className={cn("absolute bottom-0", scenery.className)} />
      ) : (
        <MascotCut
          name="plants"
          className={cn(
            "lively-sway-2 absolute bottom-0 -scale-x-100",
            wide ? "right-[90%] w-[17%]" : "right-[82%] w-[30%]",
          )}
        />
      )}

      {/*------ In Front ------*/}
      <MascotCut
        name="plants"
        className={cn("lively-sway absolute bottom-0", wide ? "left-[88%] w-[24%]" : "left-[66%] w-[44%]")}
      />

      {/*------ The Dog ------*/}
      {/* The rise on the wrapper, the idle loop on the picture, so one never cancels the other. */}
      <div className="pf-rise relative">
        <MascotCut name={name} className={cn(idle, "block w-full")} />
      </div>

      {children}
    </div>
  );
}
