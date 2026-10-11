import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { FieldError } from "~/components/ui/field";
import { describeDog } from "~/lib/dog-format";
import type { BookingOptions } from "~/orpc/order/contract";
import { DogThumb } from "~/routes/assessment/components/dog-thumb";

type DogEntry = BookingOptions["dogs"][number];
type Problem = DogEntry["problems"][number];

/*===== Dog Picker =====*/
/**
 * Part 1: the customer's dogs as selectable tiles. A dog that can't book this is shown dimmed, with each reason and
 * its way out. A dog Arman recommended this course for carries a small gold mark. The last tile adds a new dog and
 * comes back here.
 */
export function DogPicker({
  options,
  registration,
  error,
  newDogHref,
}: {
  options: BookingOptions;
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
  newDogHref: string;
}) {
  const errorId = `${registration.name}-error`;

  return (
    <div aria-describedby={error ? errorId : undefined} className="flex flex-col gap-3">
      {/* Phones scroll the tiles sideways (bleeding to the screen edge); wider screens wrap them. */}
      <div className="-mx-site flex snap-x items-start gap-3 overflow-x-auto px-site pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {options.dogs.map((entry) => {
          const { dog } = entry;

          if (entry.eligible) {
            return (
              <label key={dog.id} className="relative block w-56 shrink-0 snap-start">
                <input type="radio" value={dog.id} className="peer sr-only" {...registration} />
                <span
                  className={cn(
                    "flex h-full items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border transition-shadow",
                    "cursor-pointer peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:ring-primary/50",
                  )}
                >
                  <DogThumb dog={dog} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{dog.name}</span>
                    <span className="block text-xs text-pretty text-muted-foreground">{describeDog(dog)}</span>
                    {entry.recommendation && (
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        پیشنهاد آرمان
                      </span>
                    )}
                  </span>
                </span>
              </label>
            );
          }

          return (
            <div
              key={dog.id}
              className="flex w-72 shrink-0 snap-start flex-col gap-3 rounded-2xl bg-sunken p-3 ring-1 ring-border/60"
            >
              <div className="flex items-center gap-3 opacity-60">
                <DogThumb dog={dog} />
                <p className="min-w-0">
                  <span className="block truncate font-bold">{dog.name}</span>
                  <span className="block text-xs text-pretty text-muted-foreground">{describeDog(dog)}</span>
                </p>
              </div>
              <ul className="flex flex-col gap-3">
                {entry.problems.map((problem) => (
                  <li key={problem.kind + problem.message} className="flex flex-col gap-1">
                    <p className="text-sm text-pretty text-muted-foreground">{problem.message}</p>
                    <WaysOut problem={problem} dog={dog} prerequisites={options.course.prerequisites} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/*------ New Dog ------*/}
        <Link
          to={newDogHref}
          className="flex min-h-20 w-56 shrink-0 snap-start items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 p-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          <PlusIcon aria-hidden className="size-5" />
          سگ تازه
        </Link>
      </div>

      <div id={errorId}>
        <FieldError errors={[error]} />
      </div>
    </div>
  );
}

/*===== Ways Out =====*/
const LINK_CLASS = "rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline";

/**
 * What a customer can do about one reason, from the problem's own `courseSlug` and `enrollmentId`. Age has no way out.
 * A prerequisite names the course to pass first; if that course has a test, the test is offered too.
 */
function WaysOut({
  problem,
  dog,
  prerequisites,
}: {
  problem: Problem;
  dog: DogEntry["dog"];
  prerequisites: BookingOptions["course"]["prerequisites"];
}) {
  switch (problem.kind) {
    case "no-record":
      return (
        <Link to="/assessment" className={LINK_CLASS}>
          ارزیابی رایگان رزرو کن
        </Link>
      );
    case "prerequisite": {
      if (!problem.courseSlug) return null;
      const required = prerequisites.find((prerequisite) => prerequisite.slug === problem.courseSlug);
      return (
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to={`/courses/${problem.courseSlug}`} className={LINK_CLASS}>
            {required ? `${required.title} را ببین` : "دوره را ببین"}
          </Link>
          {required?.hasTest && (
            <Link to={`/account/book/${required.slug}?kind=test&dog=${dog.id}`} className={LINK_CLASS}>
              تستش را رزرو کن
            </Link>
          )}
        </span>
      );
    }
    case "live-enrollment":
      return (
        <Link
          to={problem.enrollmentId ? `/account/training/${problem.enrollmentId}` : "/account/training"}
          className={LINK_CLASS}
        >
          آموزش {dog.name} را ببین
        </Link>
      );
    default:
      return null;
  }
}

/*===== No Dogs =====*/
/** Part 1 for a customer with no dogs at all: one line and the way to add the first. */
export function NoDogs({ newDogHref }: { newDogHref: string }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-pretty text-muted-foreground">اول سگت را معرفی کن؛ بعد می‌توانی برایش دوره رزرو کنی.</p>
      <Link to={newDogHref} className={buttonVariants({ variant: "solid", size: "lg", className: "px-8" })}>
        سگت را معرفی کن
      </Link>
    </div>
  );
}
