import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Section Head =====*/
/** A section's Estedad `h2`, sitting straight on the plate under it. `id` labels the section. */
export function SectionHead({ id, title, className }: { id: string; title: string; className?: string }) {
  return (
    <h2 id={id} className={cn(DISPLAY_HEADING, "mb-3 text-xl text-balance", className)}>
      {title}
    </h2>
  );
}
