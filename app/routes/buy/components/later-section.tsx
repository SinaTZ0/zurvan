import { cn } from "cn";
import { CircleAlertIcon, InfoIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatTomanShort } from "~/lib/course-format";
import type { LaterCourse, LaterReason } from "~/routes/buy/buy-lists";
import { EdgeDog } from "~/routes/buy/components/edge-dog";
import { EdgeSection } from "~/routes/buy/components/edge-section";

/*===== Later Section =====*/
/**
 * «بعداً باز می‌شن»: every other shown course, calmer than the offer above. Each row is a small muted cover, the title
 * (to the course's page), the Latin name, the price muted at the end (or «بعد از ارزیابی» for a course with no price)
 * and its reasons in the server's words, each with its way out. A reason every row shared (no evaluation) was lifted
 * into the gate above, so here each row shows only its own.
 *
 * Two columns of rows on a laptop, flowed as newspaper columns so an odd count leaves no empty cell; dashed chalk rules
 * between rows, like items on a slip. On the plate's edge the center's dog sits thinking by the dimmed signpost: which
 * way next.
 */
export function LaterSection({
  rows,
  gated,
  arrive,
  delay,
}: {
  rows: readonly LaterCourse[];
  /** The gate above already says why; the line here says what happens after it. */
  gated: boolean;
  arrive: boolean;
  delay: number;
}) {
  return (
    <EdgeSection
      titleId="later-title"
      title="بعداً باز می‌شن"
      description={
        gated
          ? "بعد از ارزیابی، همین‌جا می‌بینی کدوم‌ها براش باز شدن."
          : "برای هر کدوم نوشتیم اول چی لازمه و از کجا می‌شه رسید."
      }
      arrive={arrive}
      delay={delay}
      dog={
        <EdgeDog
          name="think"
          className="w-[4.75rem] sm:w-[6rem] lg:w-[7rem]"
          scenery={{ name: "signpost", width: "150%", right: "72%" }}
        />
      }
    >
      <ul className="px-1 sm:columns-2 sm:gap-x-10 sm:px-0 lg:gap-x-14">
        {rows.map((row) => (
          <LaterRow key={row.course.slug} row={row} />
        ))}
      </ul>
    </EdgeSection>
  );
}

/*===== Later Row =====*/
function LaterRow({ row }: { row: LaterCourse }) {
  const { course, reasons } = row;

  return (
    <li className="break-inside-avoid border-b border-dashed border-foreground/20 py-4">
      <div className="flex items-start gap-3.5">
        {/*------ Cover ------*/}
        <img
          src={course.cover.src}
          alt=""
          width={course.cover.width}
          height={course.cover.height}
          loading="lazy"
          decoding="async"
          className="size-14 shrink-0 rounded-xl object-cover opacity-55 grayscale-[45%] sm:size-16"
        />

        {/*------ Title and Price ------*/}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-bold text-pretty text-foreground/90">
              <Link
                to="/courses/$slug"
                params={{ slug: course.slug }}
                className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {course.title}
              </Link>
            </h3>
            <span className="shrink-0 text-sm font-bold whitespace-nowrap text-muted-foreground tabular-nums">
              {course.price === null ? "بعد از ارزیابی" : formatTomanShort(course.price)}
            </span>
          </div>
          <p dir="ltr" className="w-fit text-xs text-muted-foreground">
            {course.latinName}
          </p>

          {/*------ Reasons ------*/}
          {course.price === null ? (
            <NoPriceNote slug={course.slug} message={reasons[0]?.message ?? "این دوره فعلاً فروخته نمی‌شه."} />
          ) : (
            reasons.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {reasons.map((reason) => (
                  <Reason key={reason.message} reason={reason} />
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </li>
  );
}

/*===== Reason =====*/
/**
 * One reason in the server's words. A dog already in the course is good news, so it gets a gold dot and the body
 * colour, not the error red; every other reason is red with an icon (never colour alone), its way out linked after it.
 */
function Reason({ reason }: { reason: LaterReason }) {
  const good = reason.kind === "active-enrollment";

  return (
    <li className={cn("flex items-start gap-2 text-pretty", good ? "text-foreground" : "text-destructive")}>
      {good ? (
        <span aria-hidden className="mt-[0.45rem] size-2 shrink-0 rounded-full bg-primary" />
      ) : (
        <CircleAlertIcon aria-hidden strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
      )}
      <span>
        {reason.message}
        {reason.way && (
          <>
            {" "}
            <Link
              {...reason.way.link}
              className="rounded-sm font-bold whitespace-nowrap underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {reason.way.label}
            </Link>
          </>
        )}
      </span>
    </li>
  );
}

/*===== No Price Note =====*/
/**
 * A course that isn't sold online (working and sport dogs, F8): the server's sentence, muted (it isn't something the
 * customer did wrong), with the way to its page.
 */
function NoPriceNote({ slug, message }: { slug: string; message: string }) {
  return (
    <p className="mt-2 flex items-start gap-2 text-sm text-pretty text-muted-foreground">
      <InfoIcon aria-hidden strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
      <span>
        {message}{" "}
        <Link
          to="/courses/$slug"
          params={{ slug }}
          className="rounded-sm font-bold whitespace-nowrap text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ببین چطور می‌شه
        </Link>
      </span>
    </p>
  );
}
