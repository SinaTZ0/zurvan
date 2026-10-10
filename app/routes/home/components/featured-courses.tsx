import { type CourseCardData, CourseCard } from "~/routes/home/components/course-card";
import { SectionHeading } from "~/routes/home/components/section-heading";

// Sample data until courses come from the database (docs/foundations-plan.md).
const FEATURED_COURSES: CourseCardData[] = [
  {
    slug: "basic-obedience",
    title: "اطاعت‌پذیری مقدماتی سگ",
    photo: "/demo/course-obedience.jpg",
    photoAlt: "مربی زانو زده و سگ کوچکی جلویش نشسته است",
    trainer: { name: "نگار رحیمی", photo: "/demo/trainer-1.jpg" },
    rating: { average: 4.9, count: 128 },
    length: "۶ هفته، ۱۲ جلسه",
    nextRun: {
      startsAt: new Date("2026-10-18T10:00:00+03:30"),
      place: "تهران، شهرک اکباتان",
      price: 2_400_000,
      seats: { capacity: 10, reserved: 6, minToStart: 8 },
    },
  },
  {
    slug: "puppy-foundations",
    title: "آموزش توله‌سگ، ۲ تا ۶ ماهگی",
    photo: "/demo/course-puppy.jpg",
    photoAlt: "دو توله‌سگ گلدن رتریور روی چمن",
    trainer: { name: "سمانه کریمی", photo: "/demo/trainer-2.jpg" },
    rating: { average: 4.8, count: 96 },
    length: "۴ هفته، ۸ جلسه",
    nextRun: {
      startsAt: new Date("2026-10-25T16:00:00+03:30"),
      place: "تهران، سعادت‌آباد",
      price: 1_600_000,
      seats: { capacity: 8, reserved: 8, minToStart: 5 },
    },
  },
  {
    slug: "calm-cat",
    title: "رفتار و آرامش گربه در خانه",
    photo: "/demo/course-cat-behaviour.jpg",
    photoAlt: "گربه‌ای با چشم‌های سبز در نور کم",
    trainer: { name: "الهام شریفی", photo: "/demo/trainer-3.jpg" },
    rating: { average: 4.9, count: 64 },
    length: "۳ هفته، ۶ جلسه",
    nextRun: {
      startsAt: new Date("2026-10-20T19:00:00+03:30"),
      place: "آنلاین",
      price: 1_200_000,
      seats: { capacity: 20, reserved: 9, minToStart: 6 },
    },
  },
];

/*===== Featured Courses =====*/
/**
 * Three courses picked by the Admin, on a sunken shelf so the raised cards stand off it. Phones scroll them sideways so
 * the next section stays close.
 */
export function FeaturedCourses() {
  return (
    <section aria-labelledby="featured-title" className="mt-section-md bg-sunken py-section-md">
      <div className="site-container">
        <SectionHeading
          id="featured-title"
          title="دوره‌های محبوب"
          description="پرطرفدارترین دوره‌های این فصل، با بهترین امتیاز از صاحبان حیوان‌ها."
          link={{ label: "همه‌ی دوره‌ها", to: "/courses" }}
        />

        {/* Below `lg` the row scrolls with snap points, bleeding to the screen edge so the next card peeks in. The
          scroller clips, so its vertical padding leaves room for the cards' shadows. */}
        <ul className="-mx-site mt-6 flex snap-x snap-mandatory scroll-px-site gap-4 overflow-x-auto px-site pt-2 pb-4 lg:mx-0 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-gutter lg:overflow-visible lg:p-0">
          {FEATURED_COURSES.map((course) => (
            <li key={course.slug} className="flex w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
              <CourseCard course={course} className="w-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
