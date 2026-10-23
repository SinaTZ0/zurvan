import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Plate Head =====*/
/**
 * A plate's heading row, sitting straight on the plate that follows it: the heading at the start and, at the end corner,
 * the plate's dog on its top edge (`figure`). The figure is in the flow, so the row is as tall as he is and the heading,
 * on the row's bottom edge, never runs under him. The caller puts the plate right after this row with no margin, so he
 * stands on its edge.
 *
 * From `lg` both columns' rows are at least as tall as the taller dog, so the two plates' top edges line up across the
 * page. `figureClassName` makes room for the scenery that stands behind him, past his own box: on his left (physical, as
 * the picture is; he faces right in both languages), which is the row's end in Persian and towards the heading in English.
 */
export function PlateHead({
  id,
  title,
  figure,
  figureClassName,
}: {
  id: string;
  title: string;
  figure?: React.ReactNode;
  figureClassName?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 lg:min-h-[7.75rem]">
      <h2 id={id} className={cn(DISPLAY_HEADING, "min-w-0 pb-3 text-h2 text-balance lg:text-[2rem]")}>
        {title}
      </h2>
      {figure && (
        <div aria-hidden className={cn("pointer-events-none relative z-10 shrink-0", figureClassName)}>
          {figure}
        </div>
      )}
    </div>
  );
}
