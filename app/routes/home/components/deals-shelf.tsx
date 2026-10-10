import { cn } from "cn";
import { TicketPercentIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { SectionHeading } from "~/routes/home/components/section-heading";
import { formatDayMonth, formatToman } from "~/routes/home/format";

type Deal = {
  id: string;
  courseSlug: string;
  title: string;
  photo: string;
  photoAlt: string;
  trainer: string;
  startsAt: Date;
  price: number;
  /** The price before the discount, when there is one. */
  fullPrice?: number;
  /** Discount codes are applied at checkout (spec 3.7); the shelf only tells people which one to use. */
  code?: string;
  seatsLeft: number;
};

// Sample data: deals come from runs with discount codes or few seats left, once both exist in the database.
const DEALS: Deal[] = [
  {
    id: "d1",
    courseSlug: "city-manners",
    title: "آداب شهری: کافه، مترو، خیابان",
    photo: "/demo/course-city.jpg",
    photoAlt: "یک گلدن رتریور خوشحال در کافه",
    trainer: "مهسا نوری",
    startsAt: new Date("2026-10-22T17:00:00+03:30"),
    price: 1_520_000,
    fullPrice: 1_900_000,
    code: "MEHR20",
    seatsLeft: 4,
  },
  {
    id: "d2",
    courseSlug: "agility-games",
    title: "چابکی و بازی‌های ذهنی",
    photo: "/demo/course-agility.jpg",
    photoAlt: "یک بوردر کالی روی سکوی تمرین",
    trainer: "نگار رحیمی",
    startsAt: new Date("2026-10-19T09:00:00+03:30"),
    price: 2_100_000,
    seatsLeft: 2,
  },
  {
    id: "d3",
    courseSlug: "separation-anxiety",
    title: "آرامش در تنهایی، برای سگ‌های مضطرب",
    photo: "/demo/course-anxiety.jpg",
    photoAlt: "زنی کنار پنجره سگش را در آغوش گرفته است",
    trainer: "سمانه کریمی",
    startsAt: new Date("2026-10-24T18:00:00+03:30"),
    price: 1_700_000,
    fullPrice: 2_000_000,
    code: "CALM15",
    seatsLeft: 6,
  },
  {
    id: "d4",
    courseSlug: "kitten-at-home",
    title: "بچه‌گربه در خانه‌ی جدید",
    photo: "/demo/course-kitten.jpg",
    photoAlt: "یک بچه‌گربه‌ی کنجکاو روی مبل",
    trainer: "الهام شریفی",
    startsAt: new Date("2026-10-21T19:00:00+03:30"),
    price: 750_000,
    fullPrice: 950_000,
    code: "KITTEN",
    seatsLeft: 11,
  },
];

// Under this many seats, the seat count is the deal's headline instead of the discount.
const LAST_SEATS_THRESHOLD = 3;

/*===== Deals Shelf =====*/
/**
 * Runs sold like shop items: a discount code or the last few seats, with the price front and centre. Phones swipe
 * through it; desktop shows the whole shelf.
 */
export function DealsShelf() {
  return (
    <section aria-labelledby="deals-title" className="site-container pt-section-md">
      <SectionHeading
        id="deals-title"
        title="فرصت‌های این هفته"
        description="کد تخفیف را موقع پرداخت وارد کن. قیمت‌ها برای هر حیوان است."
        link={{ label: "همه‌ی تخفیف‌ها", to: "/courses?deals=1" }}
      />

      <ul className="-mx-site mt-8 flex snap-x snap-mandatory scroll-px-site gap-4 overflow-x-auto px-site pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-gutter lg:overflow-visible lg:px-0 lg:pb-0">
        {DEALS.map((deal) => (
          <li key={deal.id} className="w-[64%] shrink-0 snap-start sm:w-[38%] lg:w-auto">
            <DealTile deal={deal} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/*===== Deal Tile =====*/
function DealTile({ deal }: { deal: Deal }) {
  const isLastSeats = deal.seatsLeft <= LAST_SEATS_THRESHOLD;
  const discount = deal.fullPrice ? Math.round((1 - deal.price / deal.fullPrice) * 100) : null;
  const tag = isLastSeats
    ? `فقط ${formatNumberFa(deal.seatsLeft)} جای آخر`
    : discount && `${formatNumberFa(discount)}٪ تخفیف`;

  return (
    <article className="group/deal relative flex h-full flex-col">
      {/*------ Photo and Tag ------*/}
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={deal.photo}
          alt={deal.photoAlt}
          width={960}
          height={540}
          loading="lazy"
          className="aspect-square w-full object-cover transition-transform duration-700 motion-safe:group-hover/deal:scale-103"
        />
        {tag && (
          <span
            className={cn(
              "absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold",
              isLastSeats
                ? "bg-primary text-primary-foreground"
                : "bg-card/90 text-foreground shadow-xs backdrop-blur-sm",
            )}
          >
            {tag}
          </span>
        )}
      </div>

      {/*------ Details ------*/}
      <div className="flex flex-1 flex-col gap-1 pt-4">
        <h3 className="text-base leading-snug font-extrabold">
          <Link to={`/courses/${deal.courseSlug}`} className="after:absolute after:inset-0 after:rounded-2xl">
            {deal.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {deal.trainer}، شروع {formatDayMonth(deal.startsAt)}
        </p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-3 pt-3">
          <p className="font-extrabold">{formatToman(deal.price)}</p>
          {deal.fullPrice && (
            <p className="text-sm text-muted-foreground line-through">
              <span className="sr-only">قیمت قبل: </span>
              {formatToman(deal.fullPrice)}
            </p>
          )}
        </div>
        {deal.code && (
          <p className="mt-2 flex items-center gap-1.5 self-start rounded-md border border-dashed border-saffron/60 bg-card px-2.5 py-1 text-xs">
            <TicketPercentIcon strokeWidth={1.7} className="size-4 text-saffron-text" aria-hidden />
            کد
            {/* Codes are Latin and typed as they appear, so they keep their own direction. */}
            <span dir="ltr" className="font-extrabold tracking-wider">
              {deal.code}
            </span>
          </p>
        )}
      </div>
    </article>
  );
}
