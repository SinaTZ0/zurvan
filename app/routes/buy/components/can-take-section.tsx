import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { formatNumber } from "~/lib/locale-format";
import type { Course } from "~/orpc/course/contract";
import { CourseBuyCard } from "~/routes/buy/components/course-buy-card";
import { EdgeDog } from "~/routes/buy/components/edge-dog";
import { EdgeSection } from "~/routes/buy/components/edge-section";
import { WithMark } from "~/routes/buy/components/with-mark";
import { m } from "~/paraglide/messages";

/*===== Can Take Section =====*/
/**
 * «الان می‌تونه»: the courses the picked dog can buy now, one card each, two to a row on a laptop and one on a phone.
 * An odd last card lies across both columns, so the grid never ends on an empty cell.
 *
 * On the plate's edge the center's dog trots off with his paper shop bag beside the A-frame chalkboard of the day's
 * offer: the board is left bright, as the stall's real sign, and carries «امروز» in chalk. His bubble says the list is
 * all open for the dog; the count is said again in the plain line.
 */
export function CanTakeSection({
  courses,
  dogId,
  dogName,
  arrive,
}: {
  courses: readonly Course[];
  dogId: string;
  dogName: string;
  arrive: boolean;
}) {
  return (
    <EdgeSection
      titleId="can-take-title"
      title={m.buy_can_title()}
      description={
        <>
          <WithMark
            text={(mark) =>
              (courses.length === 1 ? m.buy_can_text_one : m.buy_can_text_other)({
                count: formatNumber(courses.length),
                dog: mark,
              })
            }
          >
            <bdi>{dogName}</bdi>
          </WithMark>
        </>
      }
      arrive={arrive}
      dog={
        <EdgeDog
          name="shopping"
          className="w-[6.5rem] sm:w-[8.5rem] lg:w-[10rem]"
          scenery={{
            name: "chalkboard",
            width: "82%",
            right: "84%",
            dim: false,
            content: (
              // On the slate (its left face, 19%–71% across, 12%–75% down the picture), in chalk.
              <span className="absolute top-[30%] left-[19%] w-[52%] -rotate-3 text-center font-hand text-[0.8rem] leading-none text-chalk/85 sm:text-base lg:text-lg">
                {m.buy_can_today()}
              </span>
            ),
          }}
        >
          {/* Physical: over his head on phones, beside it (towards the words) from `sm`; the tail aims at his head. The
              words are on his other side in English, so there the bubble opens to the left and its tail (on its right)
              lands on the same spot: 38% or 48% of the box plus 2.25rem to the tail's middle. */}
          <div className="absolute bottom-[calc(100%+0.1rem)] w-[12rem] sm:bottom-[92%] sm:w-[15rem] ltr:right-[calc(62%-4.5rem)] ltr:sm:right-[calc(52%-4.5rem)] rtl:left-[38%] rtl:sm:left-[48%]">
            <ChalkBubble tail="end" className="lively-reveal-pop text-pretty">
              {m.buy_can_bubble({ dog: dogName })}
            </ChalkBubble>
          </div>
        </EdgeDog>
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:gap-6">
        {courses.map((course, index) => {
          const wide = courses.length % 2 === 1 && index === courses.length - 1;
          return (
            <li
              key={course.slug}
              className={cn(wide && "sm:col-span-2", arrive && "answer-in")}
              style={
                arrive ? ({ "--answer-delay": `${80 + Math.min(index, 4) * 60}ms` } as React.CSSProperties) : undefined
              }
            >
              {/* The verdict said `eligible` and the course has a price: the split guarantees both. */}
              <CourseBuyCard course={course} price={course.price ?? 0} dogId={dogId} wide={wide} />
            </li>
          );
        })}
      </ul>
    </EdgeSection>
  );
}
