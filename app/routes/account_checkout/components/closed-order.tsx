import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import type { CheckoutOrder } from "~/orpc/order/contract";

/*===== Closed Order =====*/
/**
 * A cancelled order (the customer booked again, or another order spent the wallet): nothing to pay, and the way to
 * book again goes back to the same dog and course so the form is filled in.
 */
export function ClosedOrder({ order }: { order: CheckoutOrder }) {
  const [item] = order.items;
  const bookAgain = item
    ? `/account/book/${item.course.slug}?${item.kind === "test" ? "kind=test&" : ""}dog=${item.dog.id}`
    : "/account/dogs";

  return (
    <section aria-labelledby="closed-title" className="rounded-3xl bg-sunken p-6 lg:p-8">
      <h2 id="closed-title" className="text-lg font-extrabold">
        این سفارش لغو شده
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        چیزی از تو کم نشده و چیزی برای پرداخت نمانده. اگر هنوز می‌خواهی، دوباره رزرو کن.
      </p>
      <Link to={bookAgain} className={buttonVariants({ size: "lg", className: "mt-6 px-8" })}>
        دوباره رزرو کن
      </Link>
    </section>
  );
}
