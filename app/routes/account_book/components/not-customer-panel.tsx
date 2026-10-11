import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== Not a Customer =====*/
/** For a signed-in trainer or partner: booking is done from a customer account, and trainers have their own pages. */
export function NotCustomerPanel({ isTrainer }: { isTrainer: boolean }) {
  return (
    <section aria-labelledby="book-not-customer-title" className="site-container py-10 lg:py-14">
      <div className="max-w-[44rem] rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border lg:p-8">
        <h1 id="book-not-customer-title" className="text-lg font-extrabold">
          این صفحه برای صاحب‌های سگ است
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          رزرو دوره از حساب مشتری انجام می‌شود. با حساب مربی نمی‌شود برای سگی دوره خرید.
        </p>
        {isTrainer && (
          <Link to="/trainer" className={buttonVariants({ variant: "solid", size: "lg", className: "mt-6 px-8" })}>
            برنامه‌ی من
          </Link>
        )}
      </div>
    </section>
  );
}
