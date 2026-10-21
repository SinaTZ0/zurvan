import { CheckIcon } from "lucide-react";

import { MascotCut } from "~/components/mascot-cut";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { PublicRecord } from "~/orpc/logbook/contract";
import { SectionHead } from "~/routes/logbook/components/section-head";

/*===== Course Medals =====*/
/**
 * «دوره‌های تموم‌شده»: one grained medal card per finished course (a gold disc with a check, the title, the Latin name,
 * the day), on a sunken panel. The `diploma` dog stands on the panel's top edge at the end side, between two bushes,
 * his box sunk a few pixels so the soft feet of the cut-out disappear into the edge. With no finished course the panel
 * says so (the section never hides: it is the record's reason to exist).
 *
 * Motion: the cards rise in as they scroll into view (`lively-reveal`, staggered by column with the animation ranges
 * in `public-record.tsx`); the dog breathes. Reduced motion shows everything.
 */
export function CourseMedals({ courses }: { courses: PublicRecord["courses"] }) {
  return (
    <section aria-labelledby="record-courses-title">
      <SectionHead id="record-courses-title" title="دوره‌های تموم‌شده">
        <div className="relative w-24 translate-y-[3%] sm:w-28">
          <MascotCut name="plants" className="lively-sway-2 absolute right-[82%] bottom-0 w-[46%] -scale-x-100" />
          <MascotCut name="diploma" className="lively-breathe relative block w-full" />
        </div>
      </SectionHead>

      <div className="rounded-4xl border border-border/60 bg-sunken paper-grain p-4 sm:p-6">
        {courses.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-foreground/15 px-6 py-8 text-center text-muted-foreground">
            هنوز دوره‌ای تموم نکرده.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            {courses.map((entry, index) => (
              <li
                key={`${entry.title}-${entry.completedAt.toISOString()}`}
                className={`lively-reveal lb-card-${(index % 3) + 1} flex items-start gap-4 rounded-3xl border border-border bg-card paper-grain p-5 shadow-[0_14px_30px_-18px_rgb(0_0_0/0.9)]`}
              >
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <CheckIcon strokeWidth={3} className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold text-pretty">{entry.title}</p>
                  <p dir="ltr" className="mt-0.5 text-start text-sm text-muted-foreground">
                    {entry.latinName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    تموم شد {formatJalaliTimestamp(entry.completedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
