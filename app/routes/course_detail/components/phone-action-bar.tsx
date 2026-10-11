import { cn } from "cn";
import { useEffect, useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import type { CourseDetail } from "~/orpc/course/contract";
import { getCourseActions } from "~/routes/course_detail/actions";

/*===== Phone Action Bar =====*/
/**
 * Phones only: once the hero's buttons have scrolled off the top, the main action follows along the bottom edge, so
 * a visitor reading the card or the reviews can act without scrolling back. It steps aside while the closing
 * section's own buttons are on screen, so there are never two of the same ask in view. Desktop has the room to keep
 * the page calm without it.
 */
export function PhoneActionBar({
  course,
  heroActionsRef,
  closingActionsRef,
}: {
  course: CourseDetail;
  heroActionsRef: React.RefObject<HTMLDivElement | null>;
  closingActionsRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [heroPassed, setHeroPassed] = useState(false);
  const [closingInView, setClosingInView] = useState(false);
  const visible = heroPassed && !closingInView;
  const { main } = getCourseActions(course);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroActionsRef.current) {
          // Only "scrolled past": above the viewport, not still waiting below it.
          setHeroPassed(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        } else {
          setClosingInView(entry.isIntersecting);
        }
      }
    });
    if (heroActionsRef.current) observer.observe(heroActionsRef.current);
    if (closingActionsRef.current) observer.observe(closingActionsRef.current);
    return () => observer.disconnect();
  }, [heroActionsRef, closingActionsRef]);

  return (
    <div
      // Hidden bars stay out of the tab order and the accessibility tree.
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-popover/95 pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-lg backdrop-blur-md lg:hidden",
        "motion-safe:transition-[translate,opacity] motion-safe:duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      <div className="site-container flex items-center justify-between gap-4 py-3">
        <p className="min-w-0 leading-snug">
          <span className="block truncate text-sm font-extrabold">{course.title}</span>
          <span className="block text-xs text-muted-foreground">
            {course.bookingKind === "behavior-request"
              ? "فرستادن درخواست رایگان است"
              : course.price !== null
                ? formatToman(course.price)
                : "ارزیابی اول رایگان است"}
          </span>
        </p>
        <Link to={main.to} className={buttonVariants({ className: "shrink-0 hover:text-primary-foreground" })}>
          {main.label}
        </Link>
      </div>
    </div>
  );
}
