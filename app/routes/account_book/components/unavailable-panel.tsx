import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import type { BookingOptions } from "~/orpc/order/contract";

/*===== Unavailable Panel =====*/
/**
 * Where the form would be, when this course (or its test) can't be booked online: the server's reason, and the way to
 * start instead, picked from `unavailableKind`.
 */
export function UnavailablePanel({ options }: { options: BookingOptions }) {
  const { course, unavailableKind, unavailableReason } = options;
  const action = getAction({ slug: course.slug, unavailableKind });

  return (
    <section aria-labelledby="book-unavailable-title" className="site-container py-10 lg:py-14">
      <div className="max-w-[44rem] rounded-3xl bg-sunken p-6 lg:p-8">
        <h2 id="book-unavailable-title" className="text-lg font-extrabold">
          این را اینجا نمی‌شود رزرو کرد
        </h2>
        <p className="mt-2 text-pretty text-muted-foreground">{unavailableReason}</p>
        <Link to={action.to} className={buttonVariants({ size: "lg", className: "mt-6 px-8" })}>
          {action.label}
        </Link>
      </div>
    </section>
  );
}

function getAction({ slug, unavailableKind }: { slug: string; unavailableKind: BookingOptions["unavailableKind"] }) {
  switch (unavailableKind) {
    case "behavior-request":
      return { label: "درخواست اصلاح رفتار", to: "/behavior-modification" };
    case "no-test":
      return { label: "دوره را ببین", to: `/courses/${slug}` };
    default:
      return { label: "ارزیابی رایگان رزرو کن", to: "/assessment" };
  }
}
