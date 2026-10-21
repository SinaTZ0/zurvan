import { cn } from "cn";

import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Edge Dog =====*/
/**
 * The center's dog standing on a plate's top edge (the Evaluation Request's edge dog): a pool of warm light behind him,
 * a bush either side, his idle loop, and a piece of scenery behind him that means something on this plate. The box is
 * sunk 3% so the cut-out's soft feet disappear into the edge. `className` sets his width (keep it under about 1.3x the
 * cut-out's natural width); `children` is his bubble or the chalk on the scenery, placed by the caller against this box.
 *
 * He rises from behind the edge as the plate scrolls in (`by-edge-rise`, page-motion.tsx): the clip moves with him, so
 * nothing shows below the edge until he is up. The bushes and the scenery don't rise: they were always there.
 *
 * Physical sides on purpose: every dog faces right (the start side in RTL), so the scenery stands behind him (left) and
 * the bush in front of him (right) is the bigger one. The chalkboard isn't in `MascotCut`'s dimmed set
 * (it can carry real chalk), so the dimming is asked for here (`dim`); the one that carries «امروز» stays bright.
 * On phones the scenery is dropped: the dog stands at the plate's corner and there is no room behind him.
 */
export function EdgeDog({
  name,
  scenery,
  className,
  children,
}: {
  name: MascotCutName;
  /** The piece behind him: its width as a share of his, how far left of him it starts, and whether it steps back. */
  scenery?: { name: MascotCutName; width: string; right?: string; dim?: boolean; content?: React.ReactNode };
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative translate-y-[3%]", className)}>
      <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Scenery ------*/}
      {/* The width is a share of his, so the piece keeps its size beside him whatever he is drawn at. */}
      {scenery && (
        <div
          className="absolute bottom-0 translate-y-[2%] max-sm:hidden"
          style={{ width: scenery.width, right: scenery.right ?? "78%" }}
        >
          <MascotCut name={scenery.name} className={cn("block w-full", scenery.dim !== false && "scenery-dim")} />
          {scenery.content}
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[80%] bottom-0 w-[38%] translate-y-[4%] -scale-x-100"
          />
        </div>
      )}

      {/*------ Bush and Dog ------*/}
      <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[74%] w-[38%]" />
      <div className="by-edge-rise relative">
        <MascotCut name={name} className="lively-breathe block w-full" />
      </div>
      {children}
    </div>
  );
}
