import { cn } from "cn";

/*===== Ground Strip =====*/
// The ground cut-out tiled edge to edge as a path between two sections. Its ends taper off, so one tile row would
// dip at every seam: a second row, mirrored and shifted half a tile, fills the dips and breaks up the repeat. A tile
// is the strip's height x 492/93 wide (296px, 381px at md); the mirrored row is placed from the right, which the flip
// turns into the left, so its seams land halfway between the first row's whatever the screen width.
const GROUND_TILE = "url(/photo/new-design/ground.webp)";

/** A full-width strip of path (dirt, stones, grass) that separates two sections, or that the mascot stands on. */
export function GroundStrip({ className }: { className?: string }) {
  const row = "absolute inset-0 bg-[length:auto_100%] bg-repeat-x";
  return (
    <div aria-hidden className={cn("pointer-events-none relative h-14 scenery-dim md:h-[4.5rem]", className)}>
      <div
        className={cn(row, "-scale-x-100 bg-[position:right_148px_top_0] md:bg-[position:right_190px_top_0]")}
        style={{ backgroundImage: GROUND_TILE }}
      />
      <div className={cn(row, "translate-y-[6%]")} style={{ backgroundImage: GROUND_TILE }} />
    </div>
  );
}
