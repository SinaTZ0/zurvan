import { cn } from "cn";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { Button } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";

export type PathCourse = { slug: string; title: string; latinName: string };

/*===== Station Slide =====*/
/**
 * Slides a station from where it was to where it is now when the order changes, so moving one up or down is seen
 * rather than guessed. Animates `transform` only (200 ms, the app's silk curve). People who ask for less motion get the
 * instant swap: the `motion-safe` rule, applied in script because the animation is a Web Animation, not a class.
 * Runs after every render, which is cheap for a path of at most eight stations and catches every kind of change
 * (move, add, remove) without tracking which one happened.
 */
function useStationSlide() {
  const nodes = useRef(new Map<string, HTMLElement>());
  const tops = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const motionSafe = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    const seen = new Set<string>();

    for (const [slug, node] of nodes.current) {
      seen.add(slug);
      const top = node.offsetTop;
      const before = tops.current.get(slug);
      if (motionSafe && before !== undefined && before !== top) {
        node.animate([{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }], {
          duration: 200,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        });
      }
      tops.current.set(slug, top);
    }
    for (const slug of tops.current.keys()) if (!seen.has(slug)) tops.current.delete(slug);
  });

  return (slug: string) => (node: HTMLElement | null) => {
    if (node) nodes.current.set(slug, node);
    else nodes.current.delete(slug);
  };
}

/*===== Recommendation Path =====*/
/**
 * The recommended courses as a numbered vertical path, the same shape the customer sees on their dog's page, so the
 * order is obviously the point. Editable (move up, move down, remove) or read-only.
 *
 * @param defaults Slugs the owner's standing recommendations suggested; those stations carry a quiet «پیش‌فرض».
 */
export function RecommendationPath({
  courses,
  defaults,
  onMove,
  onRemove,
}: {
  courses: readonly PathCourse[];
  defaults?: ReadonlySet<string>;
  /** Without these the path is read-only. */
  onMove?: (args: { index: number; direction: -1 | 1 }) => void;
  onRemove?: (index: number) => void;
}) {
  const stationRef = useStationSlide();
  const editable = !!onMove && !!onRemove;

  if (courses.length === 0) {
    return <p className="text-muted-foreground">هنوز دوره‌ای در مسیر نیست.</p>;
  }

  return (
    <ol className="relative flex flex-col">
      {courses.map((course, index) => {
        const first = index === 0;
        const last = index === courses.length - 1;

        return (
          <li key={course.slug} ref={stationRef(course.slug)} className="relative flex items-stretch gap-3">
            {/*------ Line and Station ------*/}
            <span aria-hidden className="relative flex w-9 shrink-0 items-center justify-center self-stretch">
              <span
                className={cn(
                  "absolute start-1/2 w-0.5 -translate-x-1/2 bg-primary/35 rtl:translate-x-1/2",
                  first ? "top-1/2" : "top-0",
                  last ? "bottom-1/2" : "bottom-0",
                )}
              />
              <span className="relative grid size-8 place-items-center rounded-full border-2 border-primary bg-card text-sm font-extrabold text-primary tabular-nums">
                {formatNumberFa(index + 1)}
              </span>
            </span>

            {/*------ Course ------*/}
            <div className="min-w-0 flex-1 self-center py-3">
              <p className="font-bold text-pretty">{course.title}</p>
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                <span dir="ltr">{course.latinName}</span>
                {defaults?.has(course.slug) && <span>پیش‌فرض</span>}
              </p>
            </div>

            {/*------ Moves ------*/}
            {editable && (
              <div className="flex shrink-0 items-center self-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`بالاتر: ${course.title}`}
                  title="بالاتر"
                  disabled={first}
                  onClick={() => onMove({ index, direction: -1 })}
                >
                  <ChevronUpIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`پایین‌تر: ${course.title}`}
                  title="پایین‌تر"
                  disabled={last}
                  onClick={() => onMove({ index, direction: 1 })}
                >
                  <ChevronDownIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`حذف: ${course.title}`}
                  title="حذف"
                  className="hover:text-destructive"
                  onClick={() => onRemove(index)}
                >
                  <XIcon aria-hidden />
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
