import { ChevronLeftIcon, ClipboardCheckIcon, GraduationCapIcon, UserPlusIcon, type LucideIcon } from "lucide-react";

import { Link } from "~/components/link";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Actions =====*/
// Three doors for someone who just arrived, in the order they usually need them: make an account, look at the courses,
// ask for the free assessment. Each is one link with one line saying what is behind it. The courses themselves are not
// shown on the home page: they live on `/courses`.
const ACTIONS: { icon: LucideIcon; title: string; detail: string; to: string }[] = [
  { icon: UserPlusIcon, title: "ثبت‌نام و ورود", detail: "حساب بساز و سگت رو معرفی کن.", to: "/auth" },
  {
    icon: GraduationCapIcon,
    title: "مشاهده دوره‌ها",
    detail: "از آداب خونه تا مسابقه، همه‌ی دوره‌ها یک‌جا.",
    to: "/courses",
  },
  {
    icon: ClipboardCheckIcon,
    title: "ارزیابی رایگان",
    detail: `قبل از شروع، ${HEAD_TRAINER.firstName} سگت رو از نزدیک می‌بینه.`,
    to: "/assessment",
  },
];

/*===== Quick Actions =====*/
/**
 * Under the hero: three compact cards that are each a single link. One column on phones, three across from `sm`. Quiet on
 * purpose (a border and a gold icon): the hero above and the evaluation panel below carry the page's loud moments.
 */
export function QuickActions() {
  return (
    <section aria-label="شروع سریع" className="site-container pt-section-sm">
      <ul className="grid gap-3 sm:grid-cols-3">
        {ACTIONS.map(({ icon: Icon, title, detail, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="group/action flex h-full items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-primary/60 text-primary">
                <Icon aria-hidden strokeWidth={1.5} className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">{title}</span>
                <span className="mt-0.5 block text-sm text-pretty text-muted-foreground">{detail}</span>
              </span>
              <ChevronLeftIcon
                aria-hidden
                className="size-5 shrink-0 text-primary transition-transform motion-safe:group-hover/action:-translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
