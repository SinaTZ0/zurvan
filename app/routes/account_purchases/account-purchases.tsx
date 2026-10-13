import { isRouteErrorResponse } from "react-router";

import { ChalkDoodle } from "~/components/chalk-doodle";
import { DogEmptyState } from "~/components/dog-empty-state";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";

import type { Route } from "./+types/account-purchases";
import { PaymentSlip } from "./components/payment-slip";

/*===== Guard =====*/
// The account layout lets partners in too, but payments are a customer's (docs/app-spec.md, F5).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "خریدها | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const payments = await createServerClient(request).checkout.payments();

  // The API already returns newest first; sorting again keeps the page right if that ever changes.
  // oxlint-disable-next-line unicorn/no-array-sort -- a fresh array from the spread.
  return { payments: [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) };
}

/*===== Purchases =====*/
/**
 * F5's record of what was paid: one slip per payment, with the dog and course on each line and what the payment turned
 * into. The app only records; there is nothing to pay, refund or edit here.
 */
export default function AccountPurchasesPage({ loaderData }: Route.ComponentProps) {
  const { payments } = loaderData;

  return (
    <div className="site-container py-8 lg:py-14">
      {/*===== Header =====*/}
      <header className="mb-8 flex items-center gap-4 lg:mb-10">
        <h1 className="font-display text-h1 font-black text-balance">خریدها</h1>
        <ChalkDoodle name="heart" className="w-9 rotate-12 lg:w-11" />
      </header>

      {/*===== Slips =====*/}
      {payments.length === 0 ? (
        <DogEmptyState
          bubble="هنوز چیزی نخریدم"
          title="هنوز خریدی نداری"
          action={{ label: "دوره‌ها را ببین", to: "/courses" }}
        >
          بعد از اولین پرداخت، اینجا می‌بینی چه پرداختی کردی و برای کدوم سگ.
        </DogEmptyState>
      ) : (
        <div className="flex flex-col gap-6 lg:gap-8">
          {payments.map((payment) => (
            <PaymentSlip key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="account-purchases-error-title" className="site-container py-16">
      <h1 id="account-purchases-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "خریدهایت باز نشدند"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/account" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به سگ‌های من
      </Link>
    </section>
  );
}
