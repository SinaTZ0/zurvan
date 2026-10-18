import { cn } from "cn";
import { ArrowLeftIcon, ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import type { CourseFamily } from "~/orpc/course/constants";

/*===== Needs =====*/
// Four ways in, by what the visitor needs, each opening the course grid on one family. They reuse the course photos
// (the working dogs' is Sheet C's spare cell), since the grid below shows each family's own. Behavior modification
// and online consultation, which the reference mockup had, are dropped or don't exist (app-spec), so they aren't here.
const NEEDS: { family: CourseFamily; title: string; detail: string; photo: string }[] = [
  {
    family: "basics",
    title: "سگ خونگی",
    detail: "آرامش توی خونه و عادت‌های خوب روزمره",
    photo: "/photo/home/course-bmc.webp",
  },
  {
    family: "obedience",
    title: "فرمان‌پذیری",
    detail: "از بشین تا فرمان از دور",
    photo: "/photo/home/course-elementary.webp",
  },
  {
    family: "companion",
    title: "سگ همدم",
    detail: "آرامش وسط شلوغی شهر",
    photo: "/photo/home/course-companion-4.webp",
  },
  {
    family: "working",
    title: "سگ‌های کار",
    detail: "ردیابی، نگهبانی و حفاظت",
    photo: "/photo/home/need-working.webp",
  },
];

/*===== Needs Section =====*/
/**
 * "Suited to me and you": the heading on the start side and four photo cards beside it. A card sets the course grid's
 * filter and scrolls down to it, so the visitor lands on the courses that fit. Phones put the heading on top and swipe
 * the cards sideways.
 */
export function NeedsSection({ onPick }: { onPick: (family: CourseFamily) => void }) {
  const pick = (family: CourseFamily) => {
    onPick(family);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("courses")?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="needs-title" className="pt-section-lg">
      <div className="lg:site-container lg:grid lg:max-w-[96rem] lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:items-center lg:gap-gutter">
        {/*------ Heading ------*/}
        <div className="site-container lg:px-0">
          <h2 id="needs-title" className="font-display text-h1 font-black text-balance">
            متناسب با من و تو
          </h2>
          <p className="mt-3 max-w-sm text-pretty text-muted-foreground lg:text-lead">
            بگو دنبال چی هستی؛ دوره‌هاش رو نشونت می‌دم.
          </p>
          <Link
            to="/courses"
            className="group/all mt-5 inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline lg:text-lg"
          >
            همه‌ی دوره‌ها
            <ArrowLeftIcon
              aria-hidden
              className="size-4 transition-transform motion-safe:group-hover/all:-translate-x-0.5 lg:size-5"
            />
          </Link>
        </div>

        {/*------ Cards ------*/}
        <ul
          className={cn(
            "mt-8 flex snap-x snap-mandatory scroll-px-site [scrollbar-width:none] gap-3 overflow-x-auto px-site pb-2",
            "lg:mt-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0",
          )}
        >
          {NEEDS.map((need) => (
            <li key={need.family} className="w-[62%] shrink-0 snap-start sm:w-[15rem] lg:w-auto">
              <NeedCard need={need} onPick={() => pick(need.family)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/*===== Need Card =====*/
/** The photo, the need and one line about it, with a round arrow at the end. The whole card is the one button, named
 * for what it opens; the photo is decoration here (the course cards it opens describe theirs). */
function NeedCard({ need, onPick }: { need: (typeof NEEDS)[number]; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`دوره‌های ${need.title}`}
      onClick={onPick}
      className="group/need flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-start shadow-sm transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="block aspect-[4/3] overflow-hidden lg:aspect-square">
        <img
          src={need.photo}
          alt=""
          width={744}
          height={496}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-700 motion-safe:group-hover/need:scale-[1.04]"
        />
      </span>
      <span className="flex flex-1 items-end justify-between gap-3 p-4 xl:p-5">
        <span className="min-w-0">
          <span className="block font-extrabold lg:text-lg xl:text-xl">{need.title}</span>
          <span className="mt-1 block text-xs text-muted-foreground lg:mt-2 lg:text-sm">{need.detail}</span>
        </span>
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/60 text-primary transition-colors group-hover/need:bg-primary group-hover/need:text-primary-foreground lg:size-10 xl:size-11"
        >
          <ChevronLeftIcon className="size-4 lg:size-5" />
        </span>
      </span>
    </button>
  );
}
