import { formatJalaliDate } from "~/lib/jalali";
import type { LogbookEntry } from "~/orpc/logbook/contract";

/*===== Logbook Entry Card =====*/
/**
 * One session of a dog's diary: the day, the course it belongs to, what was done and seen in the trainer's words, the
 * exercises as chips, and how the dog is getting on. `action` is the Admin's «ویرایش»; the owner has none.
 */
export function LogbookEntryCard({ entry, action }: { entry: LogbookEntry; action?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 rounded-3xl border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-sans font-bold">
          <time dateTime={entry.occurredOn}>{formatJalaliDate(entry.occurredOn)}</time>
        </h3>
        <div className="flex items-center gap-3">
          {entry.course && <span className="text-sm text-muted-foreground">{entry.course.title}</span>}
          {action}
        </div>
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
  );
}
