import { cn } from "cn";

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
    photo: "/photo/deal-city.jpg",
    photoAlt: "مردی در خیابان با سگش تمرین می‌کند",
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
    photo: "/photo/deal-agility.jpg",
    photoAlt: "مربی و سگ بوردر کالی در زمین تمرین چابکی می‌دوند",
    trainer: "نگار رحیمی",
    startsAt: new Date("2026-10-19T09:00:00+03:30"),
    price: 2_100_000,
    seatsLeft: 2,
  },
  {
    id: "d3",
    courseSlug: "separation-anxiety",
    title: "آرامش در تنهایی، برای سگ‌های مضطرب",
    photo: "/photo/deal-anxiety.jpg",
    photoAlt: "سگ پامرانین روی مبل به دست صاحبش دست می‌دهد",
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
    photo: "/photo/deal-kitten.jpg",
    photoAlt: "بچه‌گربه‌ای راه‌راه که به دوربین نگاه می‌کند",
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
/** One run as a shop card. The whole card links to the course; the reserve button and code box are only for show. */
function DealTile({ deal }: { deal: Deal }) {
  const isLastSeats = deal.seatsLeft <= LAST_SEATS_THRESHOLD;
  const discount = deal.fullPrice ? Math.round((1 - deal.price / deal.fullPrice) * 100) : null;
  const tag = isLastSeats
    ? `فقط ${formatNumberFa(deal.seatsLeft)} جای آخر`
    : discount && `${formatNumberFa(discount)}٪ تخفیف`;

  return (
    <article className="group/deal relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card">
      {/*------ Photo and Tag ------*/}
      <div className="relative h-52 overflow-hidden">
        <img
          src={deal.photo}
          alt={deal.photoAlt}
          width={800}
          height={600}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 motion-safe:group-hover/deal:scale-105"
        />
        {tag && (
          <span
            className={cn(
              "absolute start-3.5 top-3.5 rounded-full px-3 py-1 text-xs font-extrabold",
              // Last seats outrank a discount, so they get the page's deep colour instead of saffron.
              isLastSeats ? "bg-inverse text-inverse-foreground" : "bg-saffron text-saffron-foreground",
            )}
          >
            {tag}
          </span>
        )}
      </div>

      {/*------ Details ------*/}
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="text-base leading-relaxed font-extrabold sm:text-lg">
          <Link to={`/courses/${deal.courseSlug}`} className="after:absolute after:inset-0">
            {deal.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {deal.trainer} · شروع {formatDayMonth(deal.startsAt)}
        </p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2.5 pt-3">
          <p className="text-base font-extrabold sm:text-lg">{formatToman(deal.price)}</p>
          {deal.fullPrice && (
            <p className="text-sm text-muted-foreground line-through">
              <span className="sr-only">قیمت قبل: </span>
              {formatToman(deal.fullPrice)}
            </p>
          )}
        </div>

        {/*------ Code or Reserve ------*/}
        {deal.code ? (
          <p className="mt-2 flex h-11 items-center justify-between rounded-xl border-[1.5px] border-dashed border-saffron bg-saffron/10 px-3.5 text-sm">
            <span className="text-muted-foreground">کد تخفیف</span>
            {/* Codes are Latin and typed as they appear, so they keep their own direction. */}
            <span dir="ltr" className="font-extrabold tracking-wider text-saffron-text">
              {deal.code}
            </span>
          </p>
        ) : (
          <span className="mt-2 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors group-hover/deal:bg-primary/90">
            رزرو جا
          </span>
        )}
      </div>
    </article>
  );
}
