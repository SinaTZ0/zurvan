import { cn } from "cn";

/*===== Plate Head =====*/
/**
 * A plate's heading row, sitting straight on the plate that follows it (Dog Detail's section head): the heading at the
 * start, on the row's bottom edge, and at the end corner whatever stands on the plate's top edge (`children`: the
 * center's dog with his scenery). The figure is in the flow, so the row is as tall as he is and the heading never runs
 * under him.
 *
 * The caller puts the plate right after this row with no margin, so the figure (sunk a few pixels by `EdgeDog`) stands
 * on its edge. The figure is decoration: his bubble's words are said elsewhere in plain text.
 */
export function PlateHead({
  heading,
  children,
  figureClassName = "me-2 sm:me-6",
  className,
}: {
  /** The h2, and anything that goes with it. */
  heading: React.ReactNode;
  children?: React.ReactNode;
  /** The figure's distance from the end edge: room for the scenery that stands behind him (to his left). */
  figureClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0 pb-3">{heading}</div>
      {children && (
        <div aria-hidden className={cn("pointer-events-none relative z-10 shrink-0", figureClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
