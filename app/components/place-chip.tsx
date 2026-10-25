import { cn } from "cn";
import { MapPinIcon } from "lucide-react";

import { COURSE_PLACE_LABELS, type CoursePlace } from "~/orpc/course/constants";
import { m } from "~/paraglide/messages";

/*===== Place Chip =====*/
/**
 * Where a bought course is taught, as a small pill beside it (the customer's Purchases, the Admin's Payments and
 * Enrollments). Boarding is drawn in gold: it is the one place with a cost of its own, settled on the phone (F5).
 */
export function PlaceChip({ place, className }: { place: CoursePlace; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        place === "boarding"
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-foreground/20 bg-transparent text-foreground/80",
        className,
      )}
    >
      <MapPinIcon aria-hidden strokeWidth={2} className="size-3.5" />
      <span className="sr-only">{m.shared_place_label()}: </span>
      {COURSE_PLACE_LABELS[place]}
    </span>
  );
}
