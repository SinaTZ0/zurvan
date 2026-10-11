import { cn } from "cn";
import { useEffect, useRef, useState } from "react";

import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { CourseDetail } from "~/orpc/course/contract";

/** Each tick starts this long after the one before it, so a long card still finishes in about a second. */
const TICK_STAGGER_MS = 40;

/*===== Course Card Band =====*/
/**
 * The owner's own course card, as the page's one charcoal band: he sent the catalogue as printed cards, and the list
 * on each card is what the visitor is buying. The card is raised, capped with the page's one gold-leaf strip, and
 * lists everything on it, not a highlighted few.
 *
 * Behavior modification lists the problems a request can be about, and working and sport dogs their branches, since
 * that is all their cards say so far.
 */
export function CourseCardBand({ course }: { course: CourseDetail }) {
  const copy = bandCopy(course);

  return (
    <section
      aria-labelledby="card-title"
      className="glow mt-section-md surface-inverse py-section-md [--glow-alpha:0.05] [--glow-at:85%_30%] [--glow-h:80%] [--glow-w:45%]"
    >
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-x-16 xl:gap-x-24">
        {/*------ What It Teaches ------*/}
        <div className="lg:sticky lg:top-8">
          <h2 id="card-title" className="font-display text-h2 font-bold text-balance">
            {copy.title}
          </h2>
          <div className="mt-4 flex max-w-[34rem] flex-col gap-3 text-pretty text-muted-foreground">
            {copy.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/*------ The Card ------*/}
        <CourseCard course={course} />
      </div>
    </section>
  );
}

/*===== Course Card =====*/
function CourseCard({ course }: { course: CourseDetail }) {
  const kind =
    course.bookingKind === "behavior-request" ? "problems" : course.minAgeMonths === null ? "branches" : "commands";
  const countLabel = { commands: "فرمان", problems: "مشکل", branches: "گرایش" }[kind];

  return (
    <div className="overflow-hidden rounded-3xl bg-card text-card-foreground shadow-md ring-1 ring-primary/25">
      {/*------ Gold Strip ------*/}
      {/* Ink on gold, so it resets the band's re-pointed text colours, as the how-it-works panel does. */}
      <div className="flex items-end justify-between gap-6 gold-leaf px-6 py-5 [--foreground:var(--primary-foreground)] [--muted-foreground:#3a2a0c] sm:px-8">
        <div className="min-w-0">
          <p className="text-h4 leading-snug">{course.title}</p>
          <p className="text-sm font-bold text-muted-foreground">
            <bdi>{course.latinName}</bdi>
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold">
          {formatNumberFa(course.commands.length)} {countLabel}
        </p>
      </div>

      {/*------ Body ------*/}
      {kind === "branches" ? (
        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8">
          <ul className="flex flex-wrap gap-2.5">
            {course.commands.map((branch) => (
              <li key={branch} className="rounded-full border border-primary/35 px-4 py-1.5 font-bold text-primary">
                <bdi>{branch}</bdi>
              </li>
            ))}
          </ul>
          <p className="border-t pt-5 text-sm text-pretty text-muted-foreground">
            شرایط و برنامه‌ی هر گرایش بعد از ارزیابی سگت مشخص می‌شود.
          </p>
        </div>
      ) : (
        <TickedList items={course.commands} ticked={kind === "commands"} />
      )}
    </div>
  );
}

/*===== Ticked List =====*/
/**
 * The card's lines, ruled like a printed sheet, in two columns that read top to bottom. Commands get a gold tick;
 * problems get a plain mark, since ticking "aggression" would read as approving it.
 *
 * The page's one orchestrated moment: the first time the card scrolls into view, its ticks draw in one after another,
 * as if the trainer were ticking off the card. The ticks are drawn by default (server render, reduced motion, or a
 * card already on screen when the page opens) and are only hidden once we know the card is still below the fold.
 */
function TickedList({ items, ticked }: { items: string[]; ticked: boolean }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [phase, setPhase] = useState<"static" | "waiting" | "drawn">("static");

  useEffect(() => {
    if (!ticked || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          if (entry?.isIntersecting) {
            observer.disconnect();
            return;
          }
          setPhase("waiting");
          return;
        }
        if (entry?.isIntersecting) {
          setPhase("drawn");
          observer.disconnect();
        }
      },
      // A third of the card on screen, so the ticks run where the eye already is.
      { threshold: 0.3 },
    );
    observer.observe(listRef.current!);
    return () => observer.disconnect();
  }, [ticked]);

  return (
    <ul ref={listRef} data-phase={phase} className="group/ticks px-6 py-4 sm:columns-2 sm:gap-x-10 sm:px-8">
      {items.map((item, index) => (
        <li
          key={item}
          className="flex break-inside-avoid items-start gap-3 border-b py-3.5 last:border-b-0 sm:last:border-b"
        >
          {ticked ? (
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              style={{ animationDelay: `${index * TICK_STAGGER_MS}ms` }}
              className={cn(
                "mt-1 size-4 shrink-0 fill-none stroke-primary stroke-[2.2] [stroke-dasharray:1]",
                "group-data-[phase=drawn]/ticks:animate-tick-draw group-data-[phase=waiting]/ticks:[stroke-dashoffset:1]",
              )}
            >
              <path pathLength={1} strokeLinecap="round" strokeLinejoin="round" d="M2.5 8.5 6.5 12.5 13.5 3.5" />
            </svg>
          ) : (
            <span aria-hidden className="mt-2.5 h-0.5 w-3 shrink-0 rounded-full bg-primary/70" />
          )}
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/*===== Band Copy =====*/
/** The heading and the lines beside the card. Boarding is said here, once on the page, as an option. */
function bandCopy(course: CourseDetail): { title: string; body: string[] } {
  if (course.bookingKind === "behavior-request") {
    return {
      title: "مشکل‌هایی که با هم حلشان می‌کنیم",
      body: [
        `هر سگ و هر مشکلی برنامه‌ی خودش را دارد. ویدیویی از رفتار سگت بفرست؛ ${HEAD_TRAINER.firstName} پیش از اولین جلسه آن را می‌بیند و تعداد جلسه‌ها و هزینه را پیشنهاد می‌دهد.`,
        "مشکلت در این فهرست نیست؟ باز هم درخواست بفرست و توضیحش بده.",
      ],
    };
  }
  if (course.minAgeMonths === null) {
    return {
      title: "گرایش‌ها",
      body: [
        `هر گرایش برنامه‌ی جدای خودش را دارد. سن مناسب، تعداد جلسه‌ها و محل تمرین را ${HEAD_TRAINER.firstName} بعد از دیدن سگت در ارزیابی رایگان می‌گوید.`,
      ],
    };
  }
  const place =
    course.place === "home"
      ? "همه‌ی تمرین‌ها در خانه‌ی خودت است، همان‌جا که سگ هر روز زندگی می‌کند."
      : course.place === "outside"
        ? "تمرین‌ها بیرون است، در پارک یا کوچه‌های محله‌ی خودتان، جایی که حواس سگ واقعاً پرت می‌شود."
        : "بیشتر تمرین‌ها بیرون است، در پارک یا کوچه‌های محله‌ی خودتان، جایی که حواس سگ واقعاً پرت می‌شود.";
  return {
    title: "تا جلسه‌ی آخر، سگت این‌ها را بلد است",
    body: [
      `این فهرست کارت همین دوره است، همان‌طور که ${HEAD_TRAINER.firstName} درس می‌دهد. ${place}`,
      "اگر بخواهی، سگت در پانسیون می‌ماند و آموزش همان‌جا ادامه پیدا می‌کند.",
    ],
  };
}
