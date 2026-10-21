import { cn } from "cn";
import { useId } from "react";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Setting Group =====*/
/**
 * A titled group of setting plates: the Estedad heading sits above its plates, on the plates' start edge, so each group
 * reads as one block down the page (the old layout floated the name alone in a wide start column).
 */
export function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className={cn(DISPLAY_HEADING, "mb-3 text-xl text-balance")}>
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
