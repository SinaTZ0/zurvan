import { cn } from "cn";
import { InboxIcon, type LucideIcon } from "lucide-react";
import { useId } from "react";

import { ADMIN_TEAR } from "~/lib/admin-plate";
import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Admin Empty State =====*/
/**
 * An Admin list with nothing in it: a line icon in an ink ring, a title and a sentence, on a dashed grained plate (the
 * slip's tear drawn all round, a place where rows will be). The Admin area has the site's style but not its story, so
 * no dog speaks here. No button: an Admin list has no "add" to offer (rows come from customers).
 */
export function AdminEmptyState({
  title,
  icon: Icon = InboxIcon,
  children,
}: {
  title: string;
  /** The list's own icon, usually the one its page has in the rail. */
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border bg-sunken/60 paper-grain px-6 py-10 text-center sm:flex-row sm:gap-6 sm:px-10 sm:text-start",
        ADMIN_TEAR,
      )}
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground">
        <Icon aria-hidden strokeWidth={1.5} className="size-6" />
      </span>
      <div className="min-w-0">
        <h2 id={titleId} className={cn(DISPLAY_HEADING, "text-xl text-balance")}>
          {title}
        </h2>
        {children && <p className="mt-1.5 max-w-md text-sm leading-6 text-pretty text-muted-foreground">{children}</p>}
      </div>
    </section>
  );
}
