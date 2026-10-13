import { BedDoubleIcon, CheckIcon } from "lucide-react";

import { ChalkDoodle } from "~/components/chalk-doodle";
import { formatToman } from "~/lib/course-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Course } from "~/orpc/course/contract";

/*===== Learn Section =====*/
/**
 * What the course teaches, in the dog's voice: the owner's own card as a flat two-column list, one line about where the
 * training happens, and boarding as an option with its price (display only, it is not in the cart).
 *
 * Working and sport courses have no ages, sessions or commands yet, only branches, so they get pills and a note
 * instead of a list of commands: ticking a branch would promise a program that is decided after the evaluation.
 *
 * Returns just its own section: the page owns the container, the 7/5 grid beside the lane rail and the spacing.
 */
export function LearnSection({ course }: { course: Course }) {
  const isBranches = course.minAgeMonths === null;

  return (
    <section aria-labelledby="learn-title">
      {/*------ Heading ------*/}
      <div className="flex items-start gap-4">
        <h2 id="learn-title" className="font-display text-h2 font-bold text-balance">
          {isBranches ? "من توی این گرایش‌ها کار می‌کنم" : "تا آخر دوره اینا رو بلدم"}
        </h2>
        <ChalkDoodle name="paw" className="mt-1 w-9 shrink-0 -rotate-12 opacity-80 sm:w-11" />
      </div>

      {/*------ Words ------*/}
      <div className="mt-4 flex max-w-[38rem] flex-col gap-3 text-pretty text-muted-foreground">
        <p>{isBranches ? branchesLine() : placeLine(course)}</p>
      </div>

      {/*------ List ------*/}
      {isBranches ? <BranchPills branches={course.commands} /> : <CommandList commands={course.commands} />}

      {/*------ Boarding ------*/}
      {!isBranches && <Boarding boardingPrice={course.boardingPrice} />}
    </section>
  );
}

/*===== Command List =====*/
/**
 * The card's lines, ruled like a printed sheet, in two columns that read top to bottom (CSS columns, not a grid, so a
 * line never reads across). Every row carries a bottom hairline; the list is pulled down one pixel inside the clipped
 * card so the last row of the longest column doesn't sit on a stray line.
 */
function CommandList({ commands }: { commands: string[] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-sm">
      <ul className="-mb-px px-6 sm:columns-2 sm:gap-x-10 sm:px-8">
        {commands.map((command) => (
          <li key={command} className="flex break-inside-avoid items-start gap-3 border-b border-border py-3.5">
            <CheckIcon aria-hidden strokeWidth={2.4} className="mt-1.5 size-4 shrink-0 text-primary" />
            <span className="text-pretty">{command}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/*===== Branch Pills =====*/
function BranchPills({ branches }: { branches: string[] }) {
  return (
    <div className="mt-6 rounded-3xl bg-card p-6 shadow-sm sm:p-8">
      <ul className="flex flex-wrap gap-2.5">
        {branches.map((branch) => (
          <li key={branch} className="rounded-full border border-primary/35 px-4 py-1.5 font-bold text-primary">
            <bdi>{branch}</bdi>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-border pt-5 text-sm text-pretty text-muted-foreground">
        شرایط و برنامه‌ی هر گرایش بعد از ارزیابی سگت مشخص می‌شود.
      </p>
    </div>
  );
}

/*===== Boarding =====*/
/**
 * Boarding is optional and paid apart from the course, so the price is only shown, never added to anything. A course
 * without a boarding price says to call rather than showing a made-up number.
 */
function Boarding({ boardingPrice }: { boardingPrice: number | null }) {
  return (
    <div className="mt-6 flex items-start gap-4 border-t border-border pt-6">
      <BedDoubleIcon aria-hidden strokeWidth={1.5} className="mt-0.5 size-8 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-extrabold">اگه خواستی، می‌تونم پیش مربی بمونم</p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          توی پانسیون می‌مونم و آموزش همون‌جا ادامه پیدا می‌کنه. اختیاریه و قیمتش جدا از قیمت دوره‌ست.
        </p>
        <p className="mt-2 text-sm font-bold">
          {boardingPrice === null ? "برای قیمتش تماس بگیر" : formatToman(boardingPrice)}
        </p>
      </div>
    </div>
  );
}

/*===== Copy =====*/
/** One line on where the lessons happen, as the catalogue's place says it. */
function placeLine({ place }: Course): string {
  const where =
    place === "home"
      ? "همه‌ی تمرین‌هام توی خونه‌ی خودمونه، همون‌جا که هر روز زندگی می‌کنم."
      : place === "outside"
        ? "تمرین‌هام بیرونه، توی پارک یا کوچه‌های محله‌ی خودمون، جایی که حواسم واقعاً پرت می‌شه."
        : "بیشتر تمرین‌هام بیرونه، توی پارک یا کوچه‌های محله‌ی خودمون، جایی که حواسم واقعاً پرت می‌شه.";
  return `این فهرست کارت همین دوره‌ست، همون‌طور که ${HEAD_TRAINER.firstName} درس می‌ده. ${where}`;
}

function branchesLine(): string {
  return `هر گرایش برنامه‌ی جدای خودش رو داره. سن مناسب، تعداد جلسه‌ها و محل تمرین رو ${HEAD_TRAINER.firstName} بعد از دیدن من توی ارزیابی رایگان می‌گه.`;
}
