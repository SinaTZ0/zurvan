import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Detail Section =====*/
/**
 * A titled block of the file: an Estedad `h2`, an optional action at the end of its head (a link, a count, «ثبت جلسه»),
 * and the block's plate below it. Used by every section after the header so their heads, spacing and labelling are the
 * same.
 */
export function DetailSection({
  id,
  title,
  action,
  className,
  children,
}: {
  /** Prefix for the heading's id, which labels the section. */
  id: string;
  title: string;
  /** At the end of the head. */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("min-w-0", className)}>
      <div className="mb-3 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id={`${id}-title`} className={cn(DISPLAY_HEADING, "text-xl text-balance")}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
