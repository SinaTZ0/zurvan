import { PhoneIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";
import { DogMark } from "~/routes/trainer_enrollments/components/dog-mark";

/*===== Waiting List =====*/
/**
 * Paid, and nobody has been called yet: the trainer's real to-do. Each row has what the call is about, the owner's
 * phone as a `tel:` link and the times they wrote down, quoted, then goes to the page where the first session is set.
 */
export function WaitingList({ enrollments }: { enrollments: readonly TrainerEnrollment[] }) {
  return (
    <section
      aria-labelledby="waiting-title"
      className="rounded-xl border border-s-4 border-s-primary bg-card px-4 py-4 shadow-xs lg:px-5"
    >
      <h2 id="waiting-title" className="font-extrabold">
        منتظر زمان‌بندی ({formatNumberFa(enrollments.length)})
      </h2>
      <ul className="mt-2 divide-y">
        {enrollments.map((enrollment) => (
          <li
            key={enrollment.id}
            className="grid gap-x-5 gap-y-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-center"
          >
            {/*------ Dog and Course ------*/}
            <div className="flex min-w-0 items-center gap-3">
              <DogMark name={enrollment.dog.name} photo={enrollment.dog.photo} />
              <div className="min-w-0">
                <p className="truncate font-bold">{enrollment.dog.name}</p>
                <p className="truncate text-sm text-muted-foreground">{enrollment.course.title}</p>
              </div>
            </div>

            {/*------ The Call ------*/}
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-x-4">
                <span className="text-sm font-bold">{enrollment.customer.name}</span>
                {enrollment.customer.phoneNumber && (
                  <a
                    href={`tel:${enrollment.customer.phoneNumber}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
                  >
                    <PhoneIcon aria-hidden strokeWidth={1.7} className="size-4" />
                    <span dir="ltr" className="tabular-nums">
                      {toPersianDigits(enrollment.customer.phoneNumber)}
                    </span>
                  </a>
                )}
              </div>
              {enrollment.preferredTimes && (
                <blockquote className="border-s-2 border-primary/40 ps-3 text-sm text-pretty whitespace-pre-line">
                  {enrollment.preferredTimes}
                </blockquote>
              )}
            </div>

            <Link
              to={`/trainer/enrollments/${enrollment.id}`}
              aria-label={`زمان‌بندی ${enrollment.dog.name}`}
              className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit lg:justify-self-end" })}
            >
              زمان‌بندی کن
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
