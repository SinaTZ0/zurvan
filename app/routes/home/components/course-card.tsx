import { cn } from "cn";
import { BadgeCheckIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, StarIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { describeSeats, SeatRoster, type Seats } from "~/routes/home/components/seat-roster";
import { formatDayMonth, formatToman } from "~/routes/home/format";

export type CourseCardData = {
  slug: string;
  title: string;
  photo: string;
  photoAlt: string;
  trainer: { name: string; photo: string };
  rating: { average: number; count: number };
  /** e.g. "۶ هفته، ۱۲ جلسه" */
  length: string;
  nextRun: { startsAt: Date; place: string; price: number; seats: Seats };
};

const ratingFormat = new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/*===== Course Card =====*/
/**
 * The catalogue's signature card: photo, title, trainer, rating, the next run with its seats,
 * and the price. The whole card is one link; its star is the card's only saffron.
 */
export function CourseCard({ course, className }: { course: CourseCardData; className?: string }) {
  const { nextRun } = course;
  const seats = describeSeats(nextRun.seats);

  return (
    <article
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition duration-500 hover:shadow-md motion-safe:hover:-translate-y-1",
        className,
      )}
    >
      {/*------ Photo ------*/}
      <div className="overflow-hidden">
        <img
          src={course.photo}
          alt={course.photoAlt}
          width={960}
          height={540}
          loading="lazy"
          className="aspect-video w-full object-cover transition-transform duration-700 motion-safe:group-hover/card:scale-103"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/*------ Title and Trainer ------*/}
        <div className="flex flex-col gap-2">
          <h3 className="text-h4 leading-snug">
            {/* Stretched over the card, so the whole card is the link without nesting interactive elements. */}
            <Link to={`/courses/${course.slug}`} className="after:absolute after:inset-0 after:rounded-xl">
              {course.title}
            </Link>
          </h3>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <img
                src={course.trainer.photo}
                alt=""
                width={320}
                height={320}
                loading="lazy"
                className="size-7 shrink-0 rounded-full object-cover object-top"
              />
              <span className="truncate font-bold">{course.trainer.name}</span>
              <BadgeCheckIcon strokeWidth={1.7} className="size-4 shrink-0 text-success" aria-label="تأییدشده‌ی آموزش K9" />
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <StarIcon strokeWidth={1.7} fill="currentColor" className="size-4 text-saffron" aria-hidden />
              <span className="font-bold">{ratingFormat.format(course.rating.average)}</span>
              <span className="text-xs text-muted-foreground">({formatNumberFa(course.rating.count)} نظر)</span>
            </span>
          </div>
        </div>

        {/*------ Next Run ------*/}
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CalendarDaysIcon strokeWidth={1.7} className="size-4 shrink-0" aria-hidden />
            شروع {formatDayMonth(nextRun.startsAt)}
          </li>
          <li className="flex items-center gap-2">
            <MapPinIcon strokeWidth={1.7} className="size-4 shrink-0" aria-hidden />
            {nextRun.place}
          </li>
          <li className="flex items-center gap-2">
            <ClockIcon strokeWidth={1.7} className="size-4 shrink-0" aria-hidden />
            {course.length}
          </li>
        </ul>

        {/*------ Seats and Price ------*/}
        <div className="mt-auto flex flex-col gap-3 border-t pt-4">
          <div className="flex flex-col gap-2">
            <SeatRoster seats={nextRun.seats} />
            <p className="flex items-baseline justify-between gap-3 text-xs">
              <span className={cn("font-bold", seats.isFull && "text-muted-foreground")}>{seats.status}</span>
              <span className="text-muted-foreground">{seats.detail}</span>
            </p>
          </div>
          <p className="text-base font-extrabold">{formatToman(nextRun.price)}</p>
        </div>
      </div>
    </article>
  );
}
