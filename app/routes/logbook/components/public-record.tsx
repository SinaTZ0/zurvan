import { Link } from "~/components/link";
import { formatJalaliDate, formatJalaliTimestamp } from "~/lib/jalali";
import { certificatePath } from "~/lib/certificate";
import type { PublicRecord as PublicRecordData } from "~/orpc/logbook/contract";

/*===== Public Record =====*/
/**
 * A dog's record, made public by its owner (docs/app-spec.md, F14): the name, breed and age, the courses it finished, its
 * valid certificates, and the diary entries the trainer marked as showable. It is exactly what the API sent: nothing
 * about the owner, no photo, no private note ever reaches this page.
 */
export function PublicRecord({ record }: { record: PublicRecordData }) {
  return (
    <div className="max-w-2xl">
      <p dir="ltr" className="w-fit text-start font-mono text-sm tracking-wider text-muted-foreground">
        {record.fileNumber}
      </p>
      <h1 id="logbook-title" className="mt-2 font-display text-h1 font-black text-balance">
        {record.dog.name}
      </h1>
      <p className="mt-3 text-lead text-pretty text-muted-foreground">
        {[record.dog.breed, record.dog.ageText].filter(Boolean).join("، ")}
      </p>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">این پرونده را صاحب سگ عمومی کرده.</p>

      {/*------ Courses ------*/}
      <section aria-labelledby="record-courses-title" className="mt-10">
        <h2 id="record-courses-title" className="text-xl font-extrabold">
          دوره‌های تمام‌شده
        </h2>
        {record.courses.length === 0 ? (
          <p className="mt-3 text-muted-foreground">هنوز دوره‌ای تمام نکرده.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {record.courses.map((entry) => (
              <li key={`${entry.title}-${entry.completedAt.toISOString()}`} className="rounded-2xl border bg-card p-4">
                <p className="font-bold text-pretty">{entry.title}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.latinName} · تمام شد {formatJalaliTimestamp(entry.completedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/*------ Certificates ------*/}
      {record.certificates.length > 0 && (
        <section aria-labelledby="record-certificates-title" className="mt-10">
          <h2 id="record-certificates-title" className="text-xl font-extrabold">
            گواهی‌ها
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {record.certificates.map((entry) => (
              <li key={entry.number} className="rounded-2xl border bg-card p-4">
                <p className="font-bold text-pretty">{entry.courseTitle}</p>
                <p className="text-sm text-muted-foreground">
                  صادرشده در {formatJalaliTimestamp(entry.issuedAt)} ·{" "}
                  <Link
                    to={certificatePath(entry.number)}
                    className="font-mono font-bold text-primary underline-offset-4 hover:underline"
                  >
                    <bdi dir="ltr">{entry.number}</bdi>
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/*------ Diary ------*/}
      {record.entries.length > 0 && (
        <section aria-labelledby="record-diary-title" className="mt-10">
          <h2 id="record-diary-title" className="text-xl font-extrabold">
            از دفترچه‌ی تمرین
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {record.entries.map((entry) => (
              <li
                key={`${entry.occurredOn}-${entry.notes}`}
                className="flex flex-col gap-3 rounded-3xl border bg-card p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-bold">
                    <time dateTime={entry.occurredOn}>{formatJalaliDate(entry.occurredOn)}</time>
                  </h3>
                  {entry.courseTitle && <span className="text-sm text-muted-foreground">{entry.courseTitle}</span>}
                </div>
                <p className="text-pretty whitespace-pre-line">{entry.notes}</p>
                {entry.exercises.length > 0 && (
                  <ul aria-label="تمرین‌ها" className="flex flex-wrap gap-2">
                    {entry.exercises.map((exercise) => (
                      <li key={exercise} className="rounded-full border border-border px-3 py-1 text-sm">
                        {exercise}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.progress && (
                  <p className="text-sm text-pretty text-muted-foreground">
                    <span className="font-bold text-foreground">جمع‌بندی: </span>
                    {entry.progress}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
