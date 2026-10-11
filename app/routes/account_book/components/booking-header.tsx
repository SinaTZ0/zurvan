import { ClockIcon, MapPinIcon, WalletIcon } from "lucide-react";

import { Fact } from "~/components/fact";
import { Link } from "~/components/link";
import { describePlace, describeSessions, formatTomanShort } from "~/lib/course-format";
import type { BookingOptions } from "~/orpc/order/contract";

/*===== Booking Header =====*/
/**
 * Back to the course, the title, and the facts that decide whether to go on, as `Fact`s. On plain slate: the page's
 * gold leaf is the receipt's button further down.
 */
export function BookingHeader({ course, kind }: Pick<BookingOptions, "course" | "kind">) {
  const isTest = kind === "test";

  return (
    <header aria-labelledby="book-title" className="site-container pt-8 lg:pt-12">
      <Link
        to={`/courses/${course.slug}`}
        className="rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        بازگشت به صفحه‌ی دوره
      </Link>
      <h1 id="book-title" className="mt-2 font-display text-h2 font-bold text-balance">
        {isTest ? "تست" : "رزرو"} {course.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        <span dir="ltr">{course.latinName}</span>
      </p>

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-5 border-y py-5">
        <Fact icon={ClockIcon} label={isTest ? "مدت" : "جلسه‌ها"}>
          {isTest ? "یک جلسه" : describeSessions(course)}
        </Fact>
        {!isTest && (
          <Fact icon={MapPinIcon} label="محل">
            {describePlace(course)}
          </Fact>
        )}
        <Fact icon={WalletIcon} label={isTest ? "هزینه‌ی تست" : "هزینه"}>
          {course.price === null ? "بعد از ارزیابی" : formatTomanShort(course.price)}
        </Fact>
      </dl>
    </header>
  );
}
