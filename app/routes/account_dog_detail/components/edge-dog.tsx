import { cn } from "cn";

import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Edge Dog =====*/
/**
 * The center's dog standing (or lying) on a plate's top edge: a pool of warm light behind him, a bush either side, his
 * idle loop, and his own pose. The box is sunk 3% so the cut-out's soft feet disappear into the edge. `className` sets
 * his width (keep it under about 1.3x the cut-out's natural width); `children` is his bubble or a prop beside him,
 * placed by the caller against this box.
 *
 * He rises from behind the edge as the plate scrolls in (`dd-rise`, page-motion.tsx): the clip moves with him, so
 * nothing shows below the edge until he is up. The bushes don't rise: they were always there.
 *
 * Physical sides for the bushes on purpose: every dog faces right (the start side in RTL), so the bush in front of him
 * (right) is the bigger one and the one behind him, towards the plate's rounded corner, is small.
 */
export function EdgeDog({
  name,
  className,
  idle = "lively-breathe",
  bushes = true,
  wide = false,
  riseClassName,
  children,
}: {
  name: MascotCutName;
  className?: string;
  /** His idle loop (`lively-*`). */
  idle?: string;
  bushes?: boolean;
  /** A lying pose, much wider than tall: the bushes are sized to his height, not his width. */
  wide?: boolean;
  /** Replaces the rise on his wrapper (the evaluation dog sinks away instead, once the request is withdrawn). */
  riseClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative translate-y-[3%]", className)}>
      {/* A pool of warm light where he stands. */}
      <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />
      {bushes && (
        <>
          <MascotCut
            name="plants"
            className={cn("lively-sway absolute bottom-0", wide ? "left-[86%] w-[24%]" : "left-[64%] w-[46%]")}
          />
          <MascotCut
            name="plants"
            className={cn(
              "lively-sway-2 absolute bottom-0 -scale-x-100",
              wide ? "right-[90%] w-[17%]" : "right-[82%] w-[30%]",
            )}
          />
        </>
      )}
      <div className={cn("relative", riseClassName ?? "dd-rise")}>
        <MascotCut name={name} className={cn(idle, "block w-full")} />
      </div>
      {children}
    </div>
  );
}
