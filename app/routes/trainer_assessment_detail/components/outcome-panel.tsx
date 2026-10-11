import { cn } from "cn";

import type { TrainerAssessment } from "~/orpc/assessment/contract";
import { OutcomeForm } from "~/routes/trainer_assessment_detail/components/outcome-form";
import type { PathCourse } from "~/routes/trainer_assessment_detail/components/recommendation-path";
import { RecordedOutcome } from "~/routes/trainer_assessment_detail/components/recorded-outcome";

/*===== Outcome Panel =====*/
/**
 * The end column: the form when the outcome can be recorded, the same form read-only while the meeting is still ahead,
 * and the recorded result once the assessment is over. On `card` with a shadow, the page's one raised panel.
 *
 * @param courses The courses the trainer can recommend; only a booked assessment needs them.
 */
export function OutcomePanel({
  assessment,
  courses,
  className,
}: {
  assessment: TrainerAssessment;
  courses: readonly PathCourse[];
  className?: string;
}) {
  const booked = assessment.status === "booked";
  const bySlug = new Map(courses.map((course) => [course.slug, course]));
  // The owner's standing recommendations, in order, for courses that still exist in the picker.
  const suggested = assessment.suggestedCourseSlugs.flatMap((slug) => bySlug.get(slug) ?? []);

  return (
    <section
      aria-labelledby="outcome-title"
      className={cn("rounded-2xl border bg-card p-5 shadow-sm lg:p-7", className)}
    >
      <h2 id="outcome-title" className="mb-6 text-xl font-extrabold">
        نتیجه‌ی ارزیابی
      </h2>
      {booked ? (
        <OutcomeForm
          assessmentId={assessment.id}
          courses={courses}
          suggested={suggested}
          readOnly={!assessment.canRecordOutcome}
        />
      ) : (
        <RecordedOutcome assessment={assessment} />
      )}
    </section>
  );
}
