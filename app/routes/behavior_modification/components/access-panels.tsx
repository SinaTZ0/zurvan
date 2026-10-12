import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";

/*===== Access Panels =====*/
// Each stands where the form's parts would be, so a visitor who can't send a request still sees what the page is for.

const panelClass = "rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border lg:p-8";

/** Signed out: the form waits for a number. */
export function SignInPanel({ signInHref }: { signInHref: string }) {
  return (
    <section aria-labelledby="behavior-sign-in-title" className={panelClass}>
      <h2 id="behavior-sign-in-title" className="text-lg font-extrabold">
        اول وارد شو
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        برای فرستادن درخواست، اول با شماره موبایلت وارد شو. یک دقیقه طول می‌کشد.
      </p>
      <Link to={signInHref} className={buttonVariants({ variant: "solid", size: "lg", className: "mt-6 w-full" })}>
        ورود و ادامه
      </Link>
    </section>
  );
}

/** Signed in as a trainer, partner or the Admin: the page is for dog owners. */
export function NotCustomerPanel({ isTrainer }: { isTrainer: boolean }) {
  return (
    <section aria-labelledby="behavior-not-customer-title" className={panelClass}>
      <h2 id="behavior-not-customer-title" className="text-lg font-extrabold">
        این صفحه برای صاحب‌های سگ است
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        درخواست اصلاح رفتار از حساب صاحب سگ فرستاده می‌شود. درخواست‌هایی که به تو رسیده در بخش مربی است.
      </p>
      {isTrainer && (
        <Link
          to="/trainer/behavior-requests"
          className={buttonVariants({ variant: "solid", size: "lg", className: "mt-6 w-full" })}
        >
          درخواست‌های من
        </Link>
      )}
    </section>
  );
}

/** No behavior course is open for requests right now (`options.course` is null). */
export function CourseClosedPanel() {
  return (
    <section aria-labelledby="behavior-closed-title" className={panelClass}>
      <h2 id="behavior-closed-title" className="text-lg font-extrabold">
        فعلاً درخواست نمی‌گیرم
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        برای اصلاح رفتار با مرکز تماس بگیر تا بگوییم کی دوباره درخواست می‌گیریم.
      </p>
      <a
        href={`tel:${CENTER_PHONE.tel}`}
        dir="ltr"
        className="mt-4 inline-block rounded-sm text-lg font-extrabold text-primary tabular-nums underline-offset-4 hover:underline"
      >
        {CENTER_PHONE.display}
      </a>
    </section>
  );
}
