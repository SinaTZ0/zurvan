import { BadgeCheckIcon, StarIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { SectionHeading } from "~/routes/home/components/section-heading";

// Sample data until trainer profiles come from the database (docs/foundations-plan.md).
const PHOTO_ALT_NEGAR = "نگار رحیمی در حال تمرین «بزن قدش» با یک سگ";
const PHOTO_ALT_SAMANEH = "سمانه کریمی روبه‌روی سگی که به او نگاه می‌کند ایستاده است";
const PHOTO_ALT_MAHSA = "مهسا نوری در زمینی باز کنار دو سگ زانو زده است";

const TRAINERS = [
  {
    id: "negar-rahimi",
    name: "نگار رحیمی",
    photo: "/photo/trainer-negar.jpg",
    photoAlt: PHOTO_ALT_NEGAR,
    /** Where the crop is anchored, so the trainer and the animal both stay in frame. */
    photoPosition: "50% 20%",
    focus: "اطاعت‌پذیری و آمدن با صدا زدن",
    rating: 4.9,
    reviews: 212,
    years: 9,
  },
  {
    id: "samaneh-karimi",
    name: "سمانه کریمی",
    photo: "/photo/trainer-samaneh.jpg",
    photoAlt: PHOTO_ALT_SAMANEH,
    photoPosition: "50% 50%",
    focus: "توله‌سگ‌ها و اضطراب جدایی",
    rating: 4.8,
    reviews: 140,
    years: 6,
  },
  {
    id: "mahsa-nouri",
    name: "مهسا نوری",
    photo: "/photo/trainer-mahsa.jpg",
    photoAlt: PHOTO_ALT_MAHSA,
    photoPosition: "50% 70%",
    focus: "قلاده و آداب شهری",
    rating: 4.7,
    reviews: 103,
    years: 5,
  },
];

const ratingFormat = new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/*===== Trainers Section =====*/
/**
 * The centre's own trainers, all of them, with what each teaches, so people meet the person before the course. They are
 * the page's last section before the closing banner. There is no sign-up for trainers, so nothing here points to one.
 * Phones swipe through the row; from `sm` all three fit side by side.
 */
export function TrainersSection() {
  return (
    <section id="trainers" aria-labelledby="trainers-title" className="site-container scroll-mt-8 pt-section-md">
      <SectionHeading
        id="trainers-title"
        title="مربیانی که کنارت هستند"
        description="همه‌ی مربیان از خود مرکز زروان‌اند و مدارک و سابقه‌ی هر کدام پیش از اولین کلاس بررسی شده است."
      />

      <ul className="-mx-site mt-8 flex snap-x snap-mandatory scroll-px-site gap-4 overflow-x-auto px-site pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-gutter sm:overflow-visible sm:px-0 sm:pb-0">
        {TRAINERS.map((trainer) => (
          <li key={trainer.id} className="w-[68%] shrink-0 snap-start sm:w-auto">
            <Link to={`/trainers/${trainer.id}`} className="group/trainer flex h-full flex-col gap-3.5 rounded-3xl">
              {/*------ Photo and Rating ------*/}
              <span className="relative block h-80 overflow-hidden rounded-3xl bg-sunken sm:h-96">
                <img
                  src={trainer.photo}
                  alt={trainer.photoAlt}
                  width={720}
                  height={960}
                  loading="lazy"
                  style={{ objectPosition: trainer.photoPosition }}
                  className="size-full object-cover transition-transform duration-700 ease-silk motion-safe:group-hover/trainer:scale-105"
                />
                <span className="absolute start-3.5 bottom-3.5 flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold">
                  <StarIcon strokeWidth={1.7} fill="currentColor" className="size-3.5 text-saffron" aria-hidden />
                  {ratingFormat.format(trainer.rating)}
                  <span className="font-medium text-muted-foreground">({formatNumberFa(trainer.reviews)} نظر)</span>
                </span>
              </span>

              {/*------ Details ------*/}
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="text-lg font-extrabold group-hover/trainer:underline group-hover/trainer:decoration-saffron group-hover/trainer:decoration-2 group-hover/trainer:underline-offset-8 sm:text-xl">
                    {trainer.name}
                  </span>
                  <BadgeCheckIcon
                    strokeWidth={1.7}
                    className="size-5 shrink-0 text-primary"
                    aria-label="تأییدشده‌ی زروان"
                  />
                </span>
                <span className="text-sm text-balance text-muted-foreground">{trainer.focus}</span>
                <span className="text-xs text-muted-foreground">
                  مربی مرکز زروان · {formatNumberFa(trainer.years)} سال سابقه
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
