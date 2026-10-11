import type { TrainerAssessment } from "~/orpc/assessment/contract";
import { RecommendationPath } from "~/routes/trainer_assessment_detail/components/recommendation-path";
import { formatRecordedDate } from "~/routes/trainer_assessment_detail/format";

/*===== Recorded Outcome =====*/
/**
 * An assessment that is over, read-only: a completed one with its note and path and the date they were recorded; a
 * no-show or a cancelled one with its status, the note or reason, and who cancelled.
 */
export function RecordedOutcome({ assessment }: { assessment: TrainerAssessment }) {
  const { status, trainerNotes, recommendations, completedAt, cancelledBy, cancellationReason } = assessment;

  /*------ Completed ------*/
  if (status === "completed") {
    return (
      <div className="flex flex-col gap-8">
        {completedAt && <p className="text-sm text-muted-foreground">ثبت‌شده در {formatRecordedDate(completedAt)}</p>}
        <div className="flex flex-col gap-3">
          <h3 className="font-extrabold">یادداشت برای صاحب سگ</h3>
          <p className="border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{trainerNotes}</p>
        </div>
        <section aria-labelledby="recorded-path-title" className="flex flex-col gap-4">
          <h3 id="recorded-path-title" className="font-extrabold">
            مسیر پیشنهادی
          </h3>
          <RecommendationPath courses={recommendations} />
        </section>
      </div>
    );
  }

  /*------ No-Show ------*/
  if (status === "no-show") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-pretty">
          صاحب سگ به این وقت نیامد
          {completedAt ? ` (ثبت‌شده در ${formatRecordedDate(completedAt)})` : ""}.
        </p>
        {trainerNotes && (
          <div className="flex flex-col gap-3">
            <h3 className="font-extrabold">یادداشت</h3>
            <p className="border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{trainerNotes}</p>
          </div>
        )}
      </div>
    );
  }

  /*------ Cancelled ------*/
  return (
    <div className="flex flex-col gap-4">
      <p className="text-pretty">این ارزیابی را {cancelledBy === "trainer" ? "خودت" : "صاحب سگ"} لغو کرد.</p>
      {cancellationReason && (
        <div className="flex flex-col gap-3">
          <h3 className="font-extrabold">دلیل</h3>
          <p className="border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{cancellationReason}</p>
        </div>
      )}
    </div>
  );
}
