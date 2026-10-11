import { cn } from "cn";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { SessionCard } from "~/components/session-card";
import { formatNumberFa } from "~/lib/digits";
import { enrollmentTitle } from "~/lib/enrollment-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatJalaliDate, formatJalaliMonthYear } from "~/lib/jalali";
import { formatSlotDay, formatSlotTime, utcToTehranParts } from "~/lib/tehran-time";
import type { Assessment } from "~/orpc/assessment/contract";
import type { Dog } from "~/orpc/dog/contract";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";

type RecordEntry = {
  key: string;
  /** Orders the timeline, newest first. */
  at: number;
  title: string;
  /** The date line above the title. The known-since entry carries its date in the title instead. */
  when?: string;
  note?: string;
  /** The trainer's own words, quoted. */
  quote?: string | null;
  /** Courses he recommended, in order. */
  recommendations?: string[];
  /** Booked and still to come: an outlined dot instead of a filled one. */
  pending?: boolean;
  /** A course or test: its status badge, its session strip and the page that opens it. */
  enrollment?: CustomerEnrollment;
};

/** An assessment as its record entry; cancelled ones stay out of the record. */
function assessmentEntry(assessment: Assessment): RecordEntry | null {
  const when = formatJalaliDate(utcToTehranParts(assessment.startsAt).date);
  const at = assessment.startsAt.getTime();

  switch (assessment.status) {
    case "completed":
      return {
        key: assessment.id,
        at,
        when,
        title: `ارزیابی با ${HEAD_TRAINER.firstName}`,
        quote: assessment.trainerNotes,
        recommendations: assessment.recommendations.map((course) => course.title),
      };
    case "booked":
      return {
        key: assessment.id,
        at,
        title: `ارزیابی رزرو شده: ${formatSlotDay(assessment.startsAt)}، ساعت ${formatSlotTime(assessment.startsAt)}`,
        pending: true,
      };
    case "no-show":
      return { key: assessment.id, at, when, title: "ارزیابی: حاضر نشدید" };
    case "cancelled":
      return null;
  }
}

/**
 * An enrollment as its record entry, dated by how it ended (or when it was booked, while it runs). A passed or failed
 * test reads «تست X: قبول». One cancelled before any session was used never happened as far as the record goes.
 */
function enrollmentEntry(enrollment: CustomerEnrollment): RecordEntry | null {
  if (enrollment.status === "cancelled" && enrollment.usedSessions === 0) return null;

  const at = (enrollment.completedAt ?? enrollment.cancelledAt ?? enrollment.createdAt).getTime();
  const ended = enrollment.status === "passed" || enrollment.status === "failed";
  const result = enrollment.status === "passed" ? "قبول" : "مردود";

  return {
    key: enrollment.id,
    at,
    when: formatJalaliDate(utcToTehranParts(new Date(at)).date),
    title:
      enrollment.kind === "test" && ended ? `${enrollmentTitle(enrollment)}: ${result}` : enrollmentTitle(enrollment),
    quote: enrollment.trainerNote,
    pending: enrollment.status === "scheduling" || enrollment.status === "active",
    enrollment,
  };
}

/*===== Dog Record =====*/
/**
 * The dog's record (پرونده) as a vertical timeline, newest first: its assessments, its courses and tests, and, for a dog
 * the trainer already knew, «known since».
 */
export function DogRecord({
  dog,
  assessments,
  enrollments,
}: {
  dog: Dog;
  assessments: Assessment[];
  enrollments: CustomerEnrollment[];
}) {
  const entries: RecordEntry[] = [...assessments.map(assessmentEntry), ...enrollments.map(enrollmentEntry)].filter(
    (entry) => entry !== null,
  );
  if (dog.knownSince) {
    entries.push({
      key: "known-since",
      at: new Date(`${dog.knownSince}T00:00:00Z`).getTime(),
      title: `${HEAD_TRAINER.firstName} ${dog.name} را از ${formatJalaliMonthYear(dog.knownSince)} می‌شناسد`,
      note: "این آشنایی از قبل از این سایت است.",
    });
  }
  entries.sort((a, b) => b.at - a.at);

  return (
    <section aria-labelledby="record-title">
      <h2 id="record-title" className="border-b pb-3 text-lg font-extrabold">
        پرونده
      </h2>

      {entries.length === 0 ? (
        <p className="mt-4 text-pretty text-muted-foreground">پرونده‌ی {dog.name} بعد از ارزیابی رایگان باز می‌شود.</p>
      ) : (
        // The line is the list's own start border; each dot straddles it.
        <ol className="ms-1.5 mt-5 border-s">
          {entries.map((entry) => (
            <li key={entry.key} className="relative ps-6 pb-5 last:pb-2">
              {/*------ Dot ------*/}
              <span
                aria-hidden
                className={cn(
                  "absolute -start-[calc(0.375rem+0.5px)] top-2 size-3 rounded-full",
                  entry.pending ? "border-2 border-primary bg-background" : "bg-primary",
                )}
              />
              {entry.when && <p className="text-sm text-muted-foreground">{entry.when}</p>}
              {entry.enrollment ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-bold text-pretty">
                    <Link
                      to={`/account/training/${entry.enrollment.id}`}
                      className="rounded-sm underline-offset-4 hover:text-primary hover:underline"
                    >
                      {entry.title}
                    </Link>
                  </p>
                  <EnrollmentStatusBadge status={entry.enrollment.status} />
                </div>
              ) : (
                <p className="font-bold text-pretty">{entry.title}</p>
              )}
              {entry.enrollment && (
                <SessionCard
                  plannedSessions={entry.enrollment.plannedSessions}
                  sessions={entry.enrollment.sessions}
                  size="strip"
                  className="mt-2"
                />
              )}
              {entry.note && <p className="mt-1 text-sm text-pretty text-muted-foreground">{entry.note}</p>}
              {entry.quote && (
                <p className="mt-2 border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{entry.quote}</p>
              )}
              {entry.recommendations && entry.recommendations.length > 0 && (
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  پیشنهاد {HEAD_TRAINER.firstName}:{" "}
                  {entry.recommendations.map((title, index) => `${formatNumberFa(index + 1)}. ${title}`).join("  ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
