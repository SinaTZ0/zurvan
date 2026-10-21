import { cn } from "cn";

import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Edge Dog =====*/
/**
 * The center's dog on a plate's top edge (the Evaluation Request's edge dog): a pool of warm light behind him, a bush in
 * front of him, his idle loop, and a dimmed piece of scenery behind him that means something on this plate (with a
 * small bush of its own). The box is sunk 3% so the cut-out's soft feet disappear into the edge. `className` sets his
 * width (keep it under about 1.3x the cut-out's natural width); `children` is his bubble, placed by the caller against
 * this box.
 *
 * He rises from behind the edge as the plate scrolls in (`ct-edge-rise`); the bushes and the scenery were always there.
 * `MascotCut` dims every piece of scenery but the chalkboard (which can carry real chalk text elsewhere): here it is
 * only scenery, so it is dimmed by hand.
 *
 * Physical sides on purpose: every dog faces right (the start side in RTL), so the scenery stands behind him (left) and
 * the bush in front of him (right).
 */
export function EdgeDog({
  name,
  scenery,
  motionClassName = "ct-edge-rise",
  idle = "lively-breathe",
  className,
  children,
}: {
  name: MascotCutName;
  /** The dimmed piece behind him, `width` a share of his width. */
  scenery?: { name: MascotCutName; width: string };
  /** The one-off motion on his wrapper. */
  motionClassName?: string;
  /** His idle loop (`lively-*`). */
  idle?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative translate-y-[3%]", className)}>
      <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />
      {scenery && (
        <div className="absolute right-[78%] bottom-0 translate-y-[3%]" style={{ width: scenery.width }}>
          <MascotCut
            name={scenery.name}
            className={cn("block w-full", scenery.name === "chalkboard" && "scenery-dim")}
          />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[80%] bottom-0 w-[38%] translate-y-[4%] -scale-x-100"
          />
        </div>
      )}
      <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[74%] w-[38%]" />
      <div className={cn("relative", motionClassName)}>
        <MascotCut name={name} className={cn(idle, "block w-full")} />
      </div>
      {children}
    </div>
  );
}
