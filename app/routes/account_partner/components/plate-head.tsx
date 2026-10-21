import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Plate Head =====*/
/**
 * A plate's heading row, sitting straight on the plate that follows it: the heading at the start and, at the end corner,
 * the plate's dog on its top edge (`figure`). The figure is in the flow, so the row is as tall as he is and the heading,
 * on the row's bottom edge, never runs under him; his bubble sits beside his head, above the heading's line. The caller
 * puts the plate right after this row with no margin, so he stands on its edge.
 *
 * `figureClassName` makes room at the end for the scenery that stands behind him, past his own box.
 */
export function PlateHead({
  id,
  title,
  figure,
  figureClassName,
}: {
  id: string;
  title: string;
  figure: React.ReactNode;
  figureClassName?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 id={id} className={cn(DISPLAY_HEADING, "min-w-0 pb-3 text-h2 text-balance")}>
        {title}
      </h2>
      <div aria-hidden className={cn("pointer-events-none relative z-10 shrink-0", figureClassName)}>
        {figure}
      </div>
    </div>
  );
}
