import { cn } from "cn";

import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Edge Dog =====*/
/**
 * The center's dog standing on a plate's top edge (Dog Detail's edge dog): a pool of warm light behind him, a bush either
 * side, his idle loop, and a dimmed piece of scenery behind him that means something on this plate. The box is sunk 3%
 * so the cut-out's soft feet disappear into the edge. `className` sets his width (keep it under about 1.3x the
 * cut-out's natural width); `children` is his bubble, placed by the caller against this box.
 *
 * He rises from behind the edge as the plate scrolls in (`as-edge-rise`, page-motion.tsx): the clip moves with him, so
 * nothing shows below the edge until he is up. The bushes and the scenery don't rise: they were always there.
 *
 * Physical sides on purpose: every dog faces right (the start side in RTL), so the scenery stands behind him (left) and
 * the bush in front of him (right) is the bigger one.
 */
export function EdgeDog({
  name,
  scenery,
  motionClassName = "as-edge-rise",
  className,
  children,
}: {
  name: MascotCutName;
  /** The dimmed piece behind him, as a share of his width. */
  scenery?: { name: MascotCutName; width: string };
  /** The one-off motion on his wrapper: the scroll rise, or the receipt's stamp press. */
  motionClassName?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative translate-y-[3%]", className)}>
      <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />
      {/* The width is a share of his, so the piece keeps its size beside him whatever he is drawn at. */}
      {scenery && (
        <div className="absolute right-[80%] bottom-0 translate-y-[2%]" style={{ width: scenery.width }}>
          <MascotCut name={scenery.name} className="block w-full" />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[78%] bottom-0 w-[42%] translate-y-[4%] -scale-x-100"
          />
        </div>
      )}
      <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[72%] w-[40%]" />
      <div className={cn("relative", motionClassName)}>
        <MascotCut name={name} className="lively-breathe block w-full" />
      </div>
      {children}
    </div>
  );
}
