import { MascotCut } from "~/components/mascot-cut";
import { formatDate } from "~/lib/locale-format";
import type { PublicRecord } from "~/orpc/logbook/contract";
import { m } from "~/paraglide/messages";
import { SectionHead } from "~/routes/logbook/components/section-head";

/*===== Diary Timeline =====*/
/**
 * «از دفترچه‌ی تمرین»: the entries the trainer marked as showable, as a chalk timeline. A dashed gold line runs down
 * the start side with a dot per entry; each entry is a grained card with the day as its heading, the notes, the
 * exercises as chips and the «جمع‌بندی». The `read` dog lies along the list's top edge at the end side, an open book
 * under his paws. Only rendered when there is an entry.
 *
 * Motion: the chalk line draws itself down as the list scrolls through the screen (`clip-path`, scroll-driven where
 * supported); the cards rise in as they arrive. Off for reduced motion, which shows the whole line.
 */
export function DiaryTimeline({ entries }: { entries: PublicRecord["entries"] }) {
  return (
    <section aria-labelledby="record-diary-title" className="pt-section-sm">
      <SectionHead id="record-diary-title" title={m.logbook_diary_title()}>
        <div className="relative w-28 translate-y-[3%] sm:w-48">
          <MascotCut
            name="plants"
            className="lively-sway absolute right-[92%] bottom-0 hidden w-[24%] -scale-x-100 sm:block"
          />
          <MascotCut name="read" className="lively-breathe relative block w-full" />
        </div>
      </SectionHead>

      <div className="relative">
        {/*------ The chalk line ------*/}
        <svg
          aria-hidden
          className="lb-draw pointer-events-none absolute inset-y-4 start-[1.05rem] w-1 text-primary/60"
          preserveAspectRatio="none"
          viewBox="0 0 4 100"
        >
          <line
            x1="2"
            x2="2"
            y1="0"
            y2="100"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="1.5 2.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
        </svg>

        <ol className="flex flex-col gap-5">
          {entries.map((entry) => (
            <li key={`${entry.occurredOn}-${entry.notes}`} className="lively-reveal relative ps-12">
              <span
                aria-hidden
                className="absolute start-[0.55rem] top-6 size-4 rounded-full border-[3px] border-primary bg-background"
              />
              <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card paper-grain p-5 shadow-[0_14px_30px_-18px_rgb(0_0_0/0.9)]">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-display text-lg font-extrabold">
                    <time dateTime={entry.occurredOn}>{formatDate(entry.occurredOn)}</time>
                  </h3>
                  {entry.courseTitle && <span className="text-sm text-muted-foreground">{entry.courseTitle}</span>}
                </div>
                <p className="text-pretty whitespace-pre-line">{entry.notes}</p>
                {entry.exercises.length > 0 && (
                  <ul aria-label={m.logbook_diary_exercises()} className="flex flex-wrap gap-2">
                    {entry.exercises.map((exercise) => (
                      <li key={exercise} className="rounded-full border border-primary/40 px-3 py-1 text-sm">
                        {exercise}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.progress && (
                  <p className="text-sm text-pretty text-muted-foreground">
                    <span className="font-bold text-foreground">{m.logbook_diary_summary()}</span>
                    {entry.progress}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
