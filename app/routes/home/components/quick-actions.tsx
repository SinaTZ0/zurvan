import { ChevronLeftIcon, ClipboardCheckIcon, GraduationCapIcon, UserPlusIcon, type LucideIcon } from "lucide-react";

import { Link } from "~/components/link";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Actions =====*/
// Three small squares under the hero, in the order the owner named them (2026-10-19): the free assessment, signing up,
// the courses. Each is one link with one line saying what is behind it. The courses themselves are not shown on the
// home page: they live on `/courses`.
const ACTIONS: { icon: LucideIcon; title: string; detail: string; to: string }[] = [
  {
    icon: ClipboardCheckIcon,
    title: "ارزیابی رایگان",
    detail: `${HEAD_TRAINER.firstName} سگت رو از نزدیک می‌بینه.`,
    to: "/assessment",
  },
  { icon: UserPlusIcon, title: "ثبت‌نام و ورود", detail: "حساب بساز و سگت رو معرفی کن.", to: "/auth" },
  { icon: GraduationCapIcon, title: "مشاهده دوره‌ها", detail: "همه‌ی دوره‌ها یک‌جا.", to: "/courses" },
];

/*===== Quick Actions =====*/
/**
 * Under the hero: three compact squares that are each a single link, centred in one row at every width. On a phone the
 * line under the title is dropped (the squares are about 110px wide); from `sm` each square is a fixed 10 to 11rem.
 * Quiet on purpose (a border and a gold icon): the hero above and the evaluation panel below carry the page's loud
 * moments. The hero's bottom padding is the gap above them (adding another left a dead black band); the gap below keeps
 * them off the promise strip's hairline. On desktop they tuck up into the hero's faded bottom edge, so they read as
 * its continuation rather than as cards adrift between two sections.
 */
export function QuickActions() {
  return (
    <section aria-label="شروع سریع" className="relative z-10 site-container pb-section-sm lg:-mt-12">
      <ul className="mx-auto grid max-w-[36rem] grid-cols-3 gap-3 sm:gap-4">
        {ACTIONS.map(({ icon: Icon, title, detail, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="group/action relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl border border-border bg-card p-2 text-center shadow-sm transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-primary/60 text-primary sm:size-12">
                <Icon aria-hidden strokeWidth={1.5} className="size-5 sm:size-6" />
              </span>
              <span className="block text-sm leading-snug font-extrabold text-balance sm:text-base">{title}</span>
              <span className="hidden text-xs text-pretty text-muted-foreground sm:block">{detail}</span>
              <ChevronLeftIcon
                aria-hidden
                className="absolute end-2 bottom-2 size-4 text-primary transition-transform motion-safe:group-hover/action:-translate-x-0.5 max-sm:hidden"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
