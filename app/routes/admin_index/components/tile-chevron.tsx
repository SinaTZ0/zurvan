import { ChevronLeftIcon } from "lucide-react";
import { cn } from "cn";

/*===== Tile Chevron =====*/
/**
 * The mark that says "this whole tile is a link". The app is right-to-left, so the end side is the physical left and
 * the reading direction points left: the chevron faces it and nudges that way when the tile (a `group`) is hovered or
 * focused. The nudge is a `transform` behind `motion-safe:`, the only motion on this page.
 */
export function TileChevron({ className }: { className?: string }) {
  return (
    <ChevronLeftIcon
      aria-hidden
      strokeWidth={1.7}
      className={cn(
        "size-5 shrink-0 text-muted-foreground transition-transform group-hover:text-primary group-focus-visible:text-primary motion-safe:group-hover:-translate-x-1 motion-safe:group-focus-visible:-translate-x-1",
        className,
      )}
    />
  );
}
