import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { SessionCard } from "~/components/session-card";
import { formatNumberFa } from "~/lib/digits";
import { describeNextStep, enrollmentTitle, pickNextEnrollment } from "~/lib/enrollment-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { Assessment } from "~/orpc/assessment/contract";
import type { Dog } from "~/orpc/dog/contract";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";

/*===== Next Step Panel =====*/
/**
 * What to do with this dog now, in the trainer's voice. By state:
 * 0. a course or test is in progress: its next session (or that the trainer will call for the first), instead of
 *    recommendations, which would only repeat what the customer has already chosen;
 * 1. an assessment is booked: when he sees the dog, and a quiet link to My Assessments (nothing to do, so no
 *    gold-leaf button);
 * 2. the latest completed assessment has recommendations: the courses in his order, the first with the gold-leaf
 *    button and the rest quiet;
 * 3. a record without recommendations: see the courses, and book one directly from its page;
 * 4. nothing yet: the free assessment.
 */
export function NextStepPanel({
  dog,
  assessments,
  enrollments,
}: {
  dog: Dog;
  assessments: Assessment[];
  enrollments: CustomerEnrollment[];
}) {
  const training = pickNextEnrollment(enrollments);
  const booked = assessments.find((assessment) => assessment.status === "booked");
  const recommending = assessments
    .filter((assessment) => assessment.status === "completed" && assessment.recommendations.length > 0)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
  const recommendations = recommending?.recommendations ?? [];

  return (
    <section
      aria-labelledby="next-step-title"
      className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-border lg:p-6"
    >
      <h2 id="next-step-title" className="text-sm font-bold text-muted-foreground">
        قدم بعدی
      </h2>

      {training ? (
        <>
          {/*------ In Training ------*/}
          <p className="text-sm text-muted-foreground">{enrollmentTitle(training)}</p>
          <p className="-mt-2 max-w-lg text-lg leading-relaxed font-bold text-pretty">
            {describeNextStep({ enrollment: training })}
          </p>
          <SessionCard plannedSessions={training.plannedSessions} sessions={training.sessions} size="strip" />
          <Link
            to={`/account/training/${training.id}`}
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-fit" })}
          >
            جلسه‌ها و جزئیات
          </Link>
        </>
      ) : booked ? (
        <>
          {/*------ Booked ------*/}
          <p className="max-w-lg text-lg leading-relaxed text-pretty">
            {dog.name} را {formatSlotDay(booked.startsAt)} ساعت {formatSlotTime(booked.startsAt)} می‌بینم.
          </p>
          <Signature />
          <Link
            to="/account/assessments"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-fit" })}
          >
            ارزیابی‌ها
          </Link>
        </>
      ) : recommendations.length > 0 ? (
        <>
          {/*------ Recommendations ------*/}
          <p className="max-w-lg text-lg leading-relaxed text-pretty">
            بعد از ارزیابی، این دوره‌ها را به این ترتیب پیشنهاد می‌کنم:
          </p>
          <Signature />
          <ol className="flex flex-col divide-y">
            {recommendations.map((course, index) => (
              <li key={course.slug} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3">
                <p className="flex min-w-0 items-baseline gap-3">
                  <span aria-hidden className="w-5 shrink-0 text-end text-lg font-extrabold text-primary tabular-nums">
                    {formatNumberFa(index + 1)}
                  </span>
                  <span className="font-bold text-pretty">{course.title}</span>
                </p>
                {/* The booking page knows the dog and the assessment, so the recommendation arrives pre-filled. */}
                <Link
                  to={`/account/book/${course.slug}?dog=${dog.id}&assessment=${recommending?.id}`}
                  className={
                    index === 0
                      ? buttonVariants({ size: "lg", className: "max-sm:w-full" })
                      : buttonVariants({ variant: "ghost", className: "text-primary hover:text-primary" })
                  }
                >
                  {index === 0 ? `رزرو ${course.title}` : "رزرو"}
                  {index > 0 && <span className="sr-only"> {course.title}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          {/* The dog's name is the subject; the trainer is "I" because the sentence is his. */}
          <p className="max-w-lg text-lg leading-relaxed text-pretty">
            {dog.hasRecord
              ? `${dog.name} پرونده دارد؛ می‌توانی دوره‌ی بعدی‌اش را مستقیم رزرو کنی.`
              : `${dog.name} را اول رایگان می‌بینم تا بگویم از کجا شروع کنید.`}
          </p>
          <Signature />
          <Link
            to={dog.hasRecord ? "/courses" : `/assessment?dog=${dog.id}`}
            className={buttonVariants({ size: "lg", className: "w-full sm:w-fit" })}
          >
            {dog.hasRecord ? "دوره‌ها را ببین" : "ارزیابی رایگان رزرو کن"}
          </Link>
        </>
      )}
    </section>
  );
}

function Signature() {
  return <p className="-mt-2 text-sm text-muted-foreground">— {HEAD_TRAINER.firstName}</p>;
}
