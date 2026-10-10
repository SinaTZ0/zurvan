import { BadgeCheckIcon, StarIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { SectionHeading } from "~/routes/home/components/section-heading";

// Sample data until trainer profiles come from the database (docs/foundations-plan.md).
const TRAINERS = [
  {
    id: "negar-rahimi",
    name: "نگار رحیمی",
    photo: "/demo/trainer-1.jpg",
    focus: "اطاعت‌پذیری و آمدن با صدا زدن",
    city: "تهران",
    rating: 4.9,
    reviews: 212,
    years: 9,
  },
  {
    id: "samaneh-karimi",
    name: "سمانه کریمی",
    photo: "/demo/trainer-2.jpg",
    focus: "توله‌سگ‌ها و اضطراب جدایی",
    city: "تهران",
    rating: 4.8,
    reviews: 140,
    years: 6,
  },
  {
    id: "elham-sharifi",
    name: "الهام شریفی",
    photo: "/demo/trainer-3.jpg",
    focus: "رفتار گربه",
    city: "آنلاین",
    rating: 4.9,
    reviews: 87,
    years: 7,
  },
  {
    id: "mahsa-nouri",
    name: "مهسا نوری",
    photo: "/demo/trainer-4.jpg",
    focus: "قلاده و آداب شهری",
    city: "تهران و کرج",
    rating: 4.7,
    reviews: 103,
    years: 5,
  },
];

const ratingFormat = new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/*===== Trainers Section =====*/
/** A few verified trainers with what they teach, so people meet the person before the course. */
export function TrainersSection() {
  return (
    <section id="trainers" aria-labelledby="trainers-title" className="site-container scroll-mt-8 pt-section-md">
      <SectionHeading
        id="trainers-title"
        title="مربیانی که کنارت هستند"
        description="هر مربی پیش از اولین کلاس، با مدارک و سابقه‌اش توسط زروان تأیید می‌شود."
        link={{ label: "همه‌ی مربیان", to: "/trainers" }}
      />

      <ul className="mt-8 grid grid-cols-2 gap-gutter lg:grid-cols-4">
        {TRAINERS.map((trainer) => (
          <li key={trainer.id}>
            <Link
              to={`/trainers/${trainer.id}`}
              className="group/trainer flex h-full flex-col items-center rounded-xl p-2 text-center sm:p-4"
            >
              {/*------ Avatar ------*/}
              <span className="relative">
                <img
                  src={trainer.photo}
                  alt=""
                  width={320}
                  height={320}
                  loading="lazy"
                  className="size-24 rounded-full object-cover object-top ring-1 ring-border transition duration-500 group-hover/trainer:ring-4 group-hover/trainer:ring-primary/25 sm:size-32"
                />
                <span className="absolute end-0.5 bottom-0.5 flex size-8 items-center justify-center rounded-full bg-card shadow-xs">
                  <BadgeCheckIcon strokeWidth={1.7} className="size-6 text-success" aria-label="تأییدشده" />
                </span>
              </span>

              {/*------ Details ------*/}
              <span className="mt-4 text-base font-extrabold sm:text-lg">{trainer.name}</span>
              <span className="mt-1 text-sm text-balance text-muted-foreground">{trainer.focus}</span>
              <span className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <StarIcon strokeWidth={1.7} fill="currentColor" className="size-3.5 text-saffron" aria-hidden />
                  <span className="font-bold text-foreground">{ratingFormat.format(trainer.rating)}</span>
                  <span>({formatNumberFa(trainer.reviews)} نظر)</span>
                </span>
                <span>{trainer.city}</span>
                <span>{formatNumberFa(trainer.years)} سال سابقه</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
