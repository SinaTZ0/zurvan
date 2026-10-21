import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Section Head =====*/
/**
 * A section's heading row, sitting straight on the plate that follows it: the heading at the start and, at the end
 * corner, whatever stands on the plate's top edge (`children`: the mascot, a piece of scenery). The figure is in the
 * flow, so the row is as tall as he is and the heading, on the row's bottom edge, never runs under him; the gap
 * between the two keeps the heading clear of his bubble's tail.
 *
 * The caller puts the plate right after this row with no margin, so the figure (sunk a few pixels by `EdgeDog`) stands
 * on its edge.
 */
export function SectionHead({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <h2 id={id} className={cn(DISPLAY_HEADING, "min-w-0 pb-3 text-h2 text-balance")}>
        {title}
      </h2>
      {children && (
        <div aria-hidden className="pointer-events-none relative z-10 me-3 shrink-0 sm:me-6">
          {children}
        </div>
      )}
    </div>
  );
}
