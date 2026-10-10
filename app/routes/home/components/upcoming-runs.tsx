import { cn } from "cn";
import { BadgeCheckIcon, MapPinIcon, MonitorIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { describeSeats, SeatRoster, type Seats } from "~/routes/home/components/seat-roster";
import { SectionHeading } from "~/routes/home/components/section-heading";
import { dateParts, formatToman } from "~/routes/home/format";

type UpcomingRun = {
  id: string;
  courseSlug: string;
  course: string;
  trainer: string;
  startsAt: Date;
  time: string;
  /** `null` for online runs. */
  place: string | null;
  price: number;
  seats: Seats;
};

// Sample data until runs come from the database (docs/foundations-plan.md).
const UPCOMING_RUNS: UpcomingRun[] = [
  {
    id: "r1",
    courseSlug: "loose-leash-walking",
    course: "راه رفتن با قلاده، بدون کشیدن",
    trainer: "مهسا نوری",
    startsAt: new Date("2026-10-17T17:00:00+03:30"),
    time: "ساعت ۱۷",
    place: "تهران، پارک آب و آتش",
    price: 1_900_000,
    seats: { capacity: 10, reserved: 7, minToStart: 9 },
  },
  {
    id: "r2",
    courseSlug: "basic-obedience",
    course: "اطاعت‌پذیری مقدماتی سگ",
    trainer: "نگار رحیمی",
    startsAt: new Date("2026-10-18T10:00:00+03:30"),
    time: "ساعت ۱۰",
    place: "تهران، شهرک اکباتان",
    price: 2_400_000,
    seats: { capacity: 10, reserved: 6, minToStart: 8 },
  },
  {
    id: "r3",
    courseSlug: "calm-cat",
    course: "رفتار و آرامش گربه در خانه",
    trainer: "الهام شریفی",
    startsAt: new Date("2026-10-20T19:00:00+03:30"),
    time: "ساعت ۱۹",
    place: null,
    price: 1_200_000,
    seats: { capacity: 20, reserved: 9, minToStart: 6 },
  },
  {
    id: "r4",
    courseSlug: "puppy-foundations",
    course: "آموزش توله‌سگ، ۲ تا ۶ ماهگی",
    trainer: "سمانه کریمی",
    startsAt: new Date("2026-10-25T16:00:00+03:30"),
    time: "ساعت ۱۶",
    place: "تهران، سعادت‌آباد",
    price: 1_600_000,
    seats: { capacity: 8, reserved: 8, minToStart: 5 },
  },
  {
    id: "r5",
    courseSlug: "reliable-recall",
    course: "آمدن با صدا زدن",
    trainer: "نگار رحیمی",
    startsAt: new Date("2026-10-27T17:30:00+03:30"),
    time: "ساعت ۱۷:۳۰",
    place: "کرج، مهرشهر",
    price: 1_700_000,
    seats: { capacity: 8, reserved: 2, minToStart: 5 },
  },
];

/*===== Upcoming Runs =====*/
/**
 * The next runs as a schedule rather than cards: when, what, where, and how close each one is to starting. A
 * date-led list reads faster than a grid when the question is "what can my pet join soon?".
 */
export function UpcomingRuns() {
  return (
    <section id="upcoming-runs" aria-labelledby="upcoming-title" className="site-container scroll-mt-8 pt-section-md">
      <SectionHeading
        id="upcoming-title"
        title="کلاس‌های پیش رو"
        description="هر کلاس با رسیدن به حد نصاب قطعی می‌شود. تا آن موقع لغو رزرو همیشه با بازپرداخت کامل است."
        link={{ label: "همه‌ی کلاس‌ها", to: "/courses?sort=start" }}
      />

      <ol className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        {UPCOMING_RUNS.map((run) => (
          <RunRow key={run.id} run={run} />
        ))}
      </ol>
    </section>
  );
}

/*===== Run Row =====*/
function RunRow({ run }: { run: UpcomingRun }) {
  const date = dateParts(run.startsAt);
  const seats = describeSeats(run.seats);

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 p-4 transition-colors hover:bg-accent/60 sm:p-5 lg:grid-cols-[4.5rem_minmax(0,1fr)_11rem_8rem_7.5rem] lg:items-center lg:gap-x-6 lg:px-6 xl:grid-cols-[5rem_minmax(0,1fr)_14rem_9rem_8.5rem] xl:gap-x-8">
      {/*------ Date ------*/}
      <time
        dateTime={run.startsAt.toISOString()}
        className="row-span-2 flex flex-col items-center self-start rounded-xl bg-sunken py-2.5 text-center lg:row-span-1 lg:self-center"
      >
        <span className="text-2xl leading-none font-extrabold">{date.day}</span>
        <span className="mt-1 text-xs font-bold">{date.month}</span>
        <span className="text-xs text-muted-foreground">{date.weekday}</span>
      </time>

      {/*------ Course ------*/}
      <div className="min-w-0">
        <h3 className="text-base leading-snug font-extrabold">
          <Link to={`/courses/${run.courseSlug}`} className="hover:underline">
            {run.course}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BadgeCheckIcon strokeWidth={1.7} className="size-4 text-success" aria-hidden />
            {run.trainer}
          </span>
          <span className="flex items-center gap-1.5">
            {run.place ? (
              <MapPinIcon strokeWidth={1.7} className="size-4" aria-hidden />
            ) : (
              <MonitorIcon strokeWidth={1.7} className="size-4" aria-hidden />
            )}
            {run.place ?? "آنلاین"}، {run.time}
          </span>
        </p>
      </div>

      {/*------ Seats ------*/}
      <div className="col-start-2 flex flex-col gap-1.5 lg:col-start-auto">
        <SeatRoster seats={run.seats} />
        <p className="flex items-baseline justify-between gap-3 text-xs">
          <span className={cn("font-bold", seats.isFull && "text-muted-foreground")}>{seats.status}</span>
          <span className="text-muted-foreground">{seats.detail}</span>
        </p>
      </div>

      {/*------ Price and Action ------*/}
      <div className="col-span-2 flex items-center justify-between gap-4 lg:col-span-2 lg:grid lg:grid-cols-subgrid">
        <p className="font-extrabold">{formatToman(run.price)}</p>
        <Link
          to={`/courses/${run.courseSlug}?run=${run.id}`}
          className={cn(
            buttonVariants({
              variant: seats.isFull ? "outline" : "default",
              className: "lg:w-full",
            }),
          )}
        >
          {seats.isFull ? "فهرست انتظار" : "رزرو جا"}
        </Link>
      </div>
    </li>
  );
}
