import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== Sign-in Panel =====*/
/**
 * For a visitor who is signed out: one panel where the form's first three parts would be. The diary beside it still
 * shows real free times, so they see what they'd be booking before giving a number.
 */
export function SignInPanel({ signInHref }: { signInHref: string }) {
  return (
    <section
      aria-labelledby="assessment-sign-in-title"
      className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border lg:p-8"
    >
      <h2 id="assessment-sign-in-title" className="text-lg font-extrabold">
        اول وارد شو
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        برای رزرو، اول با شماره موبایلت وارد شو. یک دقیقه طول می‌کشد.
      </p>
      <Link to={signInHref} className={buttonVariants({ variant: "solid", size: "lg", className: "mt-6 w-full" })}>
        ورود و ادامه
      </Link>
    </section>
  );
}

/*===== Not a Customer =====*/
/** For a signed-in trainer, partner or the Admin: the page is for dog owners, and trainers have their own schedule. */
export function NotCustomerPanel({ isTrainer }: { isTrainer: boolean }) {
  return (
    <section
      aria-labelledby="assessment-not-customer-title"
      className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border lg:p-8"
    >
      <h2 id="assessment-not-customer-title" className="text-lg font-extrabold">
        این صفحه برای صاحب‌های سگ است
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        رزرو ارزیابی از حساب مشتری انجام می‌شود. وقت‌های آزادی که اینجا می‌بینی همان‌هایی است که مشتری‌ها می‌بینند.
      </p>
      {isTrainer && (
        <Link to="/trainer" className={buttonVariants({ variant: "solid", size: "lg", className: "mt-6 w-full" })}>
          برنامه‌ی من
        </Link>
      )}
    </section>
  );
}
