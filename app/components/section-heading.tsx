import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";

/*===== Section Heading =====*/
/** A storefront section's title, an optional one-line description, and an optional "see all" link at the end. */
export function SectionHeading({
  id,
  title,
  description,
  link,
}: {
  /** Put on the `<h2>`, for the section's `aria-labelledby`. */
  id: string;
  title: string;
  description?: string;
  link?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="max-w-2xl">
        <h2 id={id} className="font-display text-h2 font-bold text-balance">
          {title}
        </h2>
        {description && <p className="mt-2 text-pretty text-muted-foreground">{description}</p>}
      </div>
      {link && (
        <Link to={link.to} className="group/link flex items-center gap-1 rounded-sm text-sm font-bold text-primary">
          {link.label}
          {/* Points to the end of the line (left, in RTL) and nudges that way on hover. */}
          <ChevronLeftIcon
            strokeWidth={1.7}
            className="size-4 transition-transform motion-safe:group-hover/link:-translate-x-1"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
