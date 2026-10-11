import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatJalaliDate, formatJalaliMonthYear } from "~/lib/jalali";
import { formatSlotDay, formatSlotTime, utcToTehranParts } from "~/lib/tehran-time";
import type { Assessment } from "~/orpc/assessment/contract";
import type { Dog } from "~/orpc/dog/contract";

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

/*===== Dog Record =====*/
/**
 * The dog's record (پرونده) as a vertical timeline, newest first: its assessments and, for a dog the trainer already
 * knew, «known since». The enrollment and test entries join it as those entities arrive (docs/customer-area-design.md).
 */
export function DogRecord({ dog, assessments }: { dog: Dog; assessments: Assessment[] }) {
  const entries: RecordEntry[] = assessments.map(assessmentEntry).filter((entry) => entry !== null);
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
              <p className="font-bold text-pretty">{entry.title}</p>
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
