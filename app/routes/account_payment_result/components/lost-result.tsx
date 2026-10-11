import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import type { CheckoutOrder } from "~/orpc/order/contract";

/*===== Lost Result =====*/
/**
 * The payment succeeded after the order had been cancelled (the customer booked again, or another order took the
 * wallet), so there is nothing to enrol. The money isn't lost: it went to the wallet, and the page says so with the
 * amount.
 */
export function LostResult({ order }: { order: CheckoutOrder }) {
  const [item] = order.items;
  const amount = order.paidViaGateway;
  const bookAgain = item
    ? `/account/book/${item.course.slug}?${item.kind === "test" ? "kind=test&" : ""}dog=${item.dog.id}`
    : "/account/dogs";

  return (
    <section aria-labelledby="lost-title" className="rounded-3xl bg-sunken p-6 lg:p-8">
      <h2 id="lost-title" className="text-lg font-extrabold">
        مبلغ به کیف پولت رفت
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        این سفارش لغو شده بود و آموزشی ثبت نشد. <strong className="text-foreground">{formatToman(amount)}</strong> که
        پرداخت کردی به کیف پولت اضافه شد؛ می‌توانی با آن دوباره رزرو کنی.
      </p>
      <Link to={bookAgain} className={buttonVariants({ size: "lg", className: "mt-6 px-8" })}>
        دوباره رزرو کن
      </Link>
    </section>
  );
}
