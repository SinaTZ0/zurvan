import { cn } from "cn";
import { CircleAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { CourseCard } from "~/components/course-card";
import { Link } from "~/components/link";
import { ADMIN_HAIRLINE, ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import { describeAge, describePlace, formatTomanShort } from "~/lib/course-format";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { Course } from "~/orpc/course/contract";
import { COURSE_FORM_SECTIONS, type CourseFormSectionId, sectionAnchor } from "~/routes/admin_course_form/sections";

/** How long the typing must rest before the card answers, so it pops once per change and not once per letter. */
const SETTLE_MS = 450;

/*===== Course Preview =====*/
/**
 * The column beside the form (under it on phones): from `xl` a small contents list that jumps to each plate and marks
 * the ones with a message, then the plate «کارتش توی فهرست» with the real `CourseCard` the catalogue renders, fed what
 * is typed, so what he sees is what customers will see by construction. Under the card, the facts it doesn't show:
 * the page's address, the price when it is blank, the ages, the place and the boarding price.
 *
 * The card is inert (its link leads to a page that may not exist yet) and answers a change of title, price or cover
 * with a quick `answer-pop` once the typing rests, never on load.
 */
export function CoursePreview({
  course,
  address,
  archived,
  invalidSections,
}: {
  course: Course;
  /** The slug as typed (new) or kept (edit); empty while a new course has none. */
  address: string;
  archived: boolean;
  invalidSections: ReadonlySet<CourseFormSectionId>;
}) {
  const popKey = useSettledChange(`${course.title}|${course.price ?? ""}|${course.cover.src}`);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {/*===== Contents =====*/}
      {/* Only beside the form: on phones the plates are right there, one after another. */}
      <nav aria-label="بخش‌های فرم" className="hidden xl:block">
        <ul className="grid grid-cols-2 gap-x-3">
          {COURSE_FORM_SECTIONS.map((section) => {
            const invalid = invalidSections.has(section.id);
            return (
              <li key={section.id}>
                <Link
                  to={`#${sectionAnchor(section.id)}`}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    invalid
                      ? "font-bold text-destructive"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  {invalid && (
                    <CircleAlertIcon
                      aria-hidden
                      strokeWidth={1.8}
                      className="answer-pop size-3.5 shrink-0 [--pop-origin:50%_50%]"
                    />
                  )}
                  <span className="truncate">{section.title}</span>
                  {invalid && <span className="sr-only">، پیام داره</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/*===== The Card =====*/}
      <aside aria-labelledby="course-preview-title" className={cn(ADMIN_PLATE, "min-w-0 p-4 sm:p-5")}>
        <h2 id="course-preview-title" className={cn(DISPLAY_HEADING, "text-xl")}>
          کارتش توی فهرست
        </h2>
        <p className="mt-1 text-xs text-pretty text-muted-foreground">
          {archived ? "بایگانی‌شده‌ست؛ تا برنگردونیش توی فهرست نمیاد." : "همین‌طوری که می‌نویسی عوض می‌شه."}
        </p>

        <div
          key={popKey.key}
          inert
          className={cn("mt-4 [--pop-origin:50%_50%]", popKey.changed && "acf-card-pop", archived && "opacity-60")}
        >
          <CourseCard course={course} showPrerequisites />
        </div>

        {/*------ Facts the Card Doesn't Show ------*/}
        <dl className={cn("mt-4 divide-y border-t text-sm", ADMIN_HAIRLINE, ADMIN_TEAR)}>
          <Fact label="نشانی">
            {address ? (
              <bdi dir="ltr" className="break-all">
                /courses/{address}
              </bdi>
            ) : (
              <span className="text-muted-foreground">هنوز نداره</span>
            )}
          </Fact>
          {course.price === null && <Fact label="قیمت">بعد از ارزیابی</Fact>}
          <Fact label="سن">{describeAge(course)}</Fact>
          <Fact label="کجا">{describePlace(course)}</Fact>
          <Fact label="نگهداری شبانه">
            {course.boardingPrice === null ? "نداره" : formatTomanShort(course.boardingPrice)}
          </Fact>
        </dl>
      </aside>
    </div>
  );
}

/*===== Fact =====*/
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end text-foreground/90">{children}</dd>
    </div>
  );
}

/*===== Settled Change =====*/
/**
 * A key that follows `value` once it has rested for `SETTLE_MS`, and whether it has changed since the first render:
 * the card is remounted on the new key and pops only then, never on load.
 */
function useSettledChange(value: string): { key: string; changed: boolean } {
  const [settled, setSettled] = useState({ key: value, changed: false });

  useEffect(() => {
    if (value === settled.key) return;
    const timer = window.setTimeout(() => setSettled({ key: value, changed: true }), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [value, settled.key]);

  return settled;
}
