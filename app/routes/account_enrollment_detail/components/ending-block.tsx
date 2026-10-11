import { formatToman } from "~/lib/course-format";
import { trainerFirstName } from "~/lib/enrollment-format";
import { formatJalaliDate } from "~/lib/jalali";
import { utcToTehranParts } from "~/lib/tehran-time";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";

function dateOf(date: Date): string {
  return formatJalaliDate(utcToTehranParts(date).date);
}

/*===== Ending Block =====*/
/**
 * How the enrollment ended, when it has: the trainer's final note, quoted and signed, for a result; or who cancelled,
 * why, and what went back to the wallet. Renders nothing for a live enrollment.
 */
export function EndingBlock({ enrollment }: { enrollment: CustomerEnrollment }) {
  const trainer = trainerFirstName(enrollment.trainer);

  /*------ Result ------*/
  if (enrollment.status === "passed" || enrollment.status === "failed") {
    return (
      <section aria-labelledby="result-title">
        <h2 id="result-title" className="mb-3 text-lg font-extrabold">
          نتیجه: {enrollment.status === "passed" ? "قبول" : "مردود"}
        </h2>
        {enrollment.trainerNote ? (
          <figure>
            <blockquote className="border-s-2 border-primary/50 ps-4 text-lg leading-relaxed text-pretty whitespace-pre-line">
              {enrollment.trainerNote}
            </blockquote>
            <figcaption className="mt-2 ps-4 text-sm text-muted-foreground">
              — {trainer}
              {enrollment.completedAt && `، ${dateOf(enrollment.completedAt)}`}
            </figcaption>
          </figure>
        ) : (
          enrollment.completedAt && <p className="text-muted-foreground">{dateOf(enrollment.completedAt)}</p>
        )}
      </section>
    );
  }

  /*------ Cancelled ------*/
  if (enrollment.status === "cancelled") {
    const byCustomer = enrollment.cancelledByRole === "customer";
    return (
      <section aria-labelledby="cancelled-title">
        <h2 id="cancelled-title" className="mb-3 text-lg font-extrabold">
          لغو شد
        </h2>
        <p className="text-pretty">
          {byCustomer ? "تو این آموزش را لغو کردی" : `${trainer} این آموزش را لغو کرد`}
          {enrollment.cancelledAt && ` (${dateOf(enrollment.cancelledAt)})`}.{" "}
          {enrollment.refundedAmount > 0
            ? `${formatToman(enrollment.refundedAmount)} به کیف پولت برگشت.`
            : "پولی برنگشت."}
        </p>
        {enrollment.cancellationReason && (
          <p className="mt-3 border-s-2 border-border ps-4 text-pretty text-muted-foreground">
            «{enrollment.cancellationReason}»
          </p>
        )}
      </section>
    );
  }

  return null;
}
