import { useEffect, useState } from "react";
import { type ShouldRevalidateFunctionArgs, useLocation, useNavigate } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import { AssessmentsEmpty } from "~/routes/account_assessments/components/assessments-empty";
import { PastLedger } from "~/routes/account_assessments/components/past-ledger";
import { UpcomingCard } from "~/routes/account_assessments/components/upcoming-card";

import type { Route } from "./+types/account-assessments";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "ارزیابی‌ها | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const assessments = await createServerClient(request).assessment.listMine({});
  // Only an assessment of this customer's own can be stamped, so a made-up `?booked=` stamps nothing.
  const booked = new URL(request.url).searchParams.get("booked");
  const bookedId = assessments.some((assessment) => assessment.id === booked && assessment.status === "booked")
    ? booked
    : null;
  return { assessments, bookedId };
}

/*===== Revalidation =====*/
/**
 * Dropping `?booked=` from the URL must not refetch: the loader would answer without `bookedId` and the stamp would
 * vanish the moment it landed. Every other revalidation (after a cancellation) keeps the default.
 */
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  const onlyBookedDropped =
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.searchParams.has("booked") &&
    !nextUrl.searchParams.has("booked");
  return onlyBookedDropped ? false : defaultShouldRevalidate;
}

/*===== Page =====*/
export default function AssessmentsPage({ loaderData }: Route.ComponentProps) {
  const { assessments } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();

  /*------ The Stamp ------*/
  // Kept in state, not read from the loader on every render: the URL loses `booked` right after mount, and the card
  // must keep its place and its stamp for the rest of the visit.
  const [stampedId] = useState(loaderData.bookedId);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has("booked")) return;
    params.delete("booked");
    const search = params.toString();
    // Replace, so Back doesn't return to the URL that stamps again.
    void navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true, preventScrollReset: true },
    );
  }, [location.pathname, location.search, navigate]);

  /*------ Groups ------*/
  const upcoming = assessments
    .filter((assessment) => assessment.status === "booked")
    // Soonest first; the one just booked goes ahead of the rest while it carries the stamp.
    .sort(
      (a, b) => Number(b.id === stampedId) - Number(a.id === stampedId) || a.startsAt.getTime() - b.startsAt.getTime(),
    );
  const past = assessments
    .filter((assessment) => assessment.status !== "booked")
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  const isEmpty = assessments.length === 0;

  return (
    <div className="site-container py-8 lg:py-12">
      {/*===== Header =====*/}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
        <div>
          <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">ارزیابی‌ها</h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            وقت‌هایی که آرمان سگ‌هایت را می‌بیند، و حرف‌هایش بعد از هر ارزیابی.
          </p>
        </div>

        {/* The empty state has its own, gold-leaf button; two calls to the same action would compete. */}
        {!isEmpty && (
          <Link to="/assessment" className={buttonVariants({ variant: "outline", className: "sm:shrink-0" })}>
            ارزیابی تازه رزرو کن
          </Link>
        )}
      </header>

      {isEmpty ? (
        <AssessmentsEmpty />
      ) : (
        <div className="flex flex-col gap-12">
          {/*===== Upcoming =====*/}
          <section aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className="mb-4 text-lg font-extrabold">
              در راه
            </h2>
            {upcoming.length > 0 ? (
              <ul className="flex max-w-176 flex-col gap-6">
                {upcoming.map((assessment) => (
                  <UpcomingCard key={assessment.id} assessment={assessment} stamped={assessment.id === stampedId} />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                ارزیابی‌ای در راه نیست.{" "}
                <Link to="/assessment" className="font-bold text-primary underline-offset-4 hover:underline">
                  یک وقت رزرو کن
                </Link>
              </p>
            )}
          </section>

          {/*===== Past =====*/}
          {past.length > 0 && (
            <section aria-labelledby="past-title">
              <h2 id="past-title" className="mb-4 text-lg font-extrabold">
                گذشته
              </h2>
              <PastLedger assessments={past} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the tabs and the way out stay on screen.
export function ErrorBoundary() {
  return (
    <section aria-labelledby="assessments-error-title" className="site-container py-16">
      <h1 id="assessments-error-title" className="text-2xl font-extrabold">
        ارزیابی‌هایت بالا نیامد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد و فهرست باز نشد. وقت‌هایت سر جایشان هستند؛ دوباره امتحان کن.
      </p>
      <Link
        to="/account/assessments"
        reloadDocument
        className={buttonVariants({ variant: "outline", className: "mt-6" })}
      >
        دوباره امتحان کن
      </Link>
    </section>
  );
}
