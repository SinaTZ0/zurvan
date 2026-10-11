import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== Not a Customer =====*/
/** For a signed-in trainer or partner: orders belong to customers, and trainers have their own pages. */
export function NotCustomerPanel({ isTrainer }: { isTrainer: boolean }) {
  return (
    <section
      aria-labelledby="checkout-not-customer-title"
      className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border lg:p-8"
    >
      <h1 id="checkout-not-customer-title" className="text-lg font-extrabold">
        این صفحه برای صاحب‌های سگ است
      </h1>
      <p className="mt-2 text-pretty text-muted-foreground">
        پرداخت دوره از حساب مشتری انجام می‌شود. با حساب مربی سفارشی برای پرداخت نیست.
      </p>
      {isTrainer && (
        <Link to="/trainer" className={buttonVariants({ variant: "solid", size: "lg", className: "mt-6 px-8" })}>
          برنامه‌ی من
        </Link>
      )}
    </section>
  );
}
