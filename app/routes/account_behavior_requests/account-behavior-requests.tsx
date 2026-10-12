import { type ShouldRevalidateFunctionArgs, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import { RequestCard } from "~/routes/account_behavior_requests/components/request-card";
import { RequestLedger } from "~/routes/account_behavior_requests/components/request-ledger";
import { RequestsEmpty } from "~/routes/account_behavior_requests/components/requests-empty";
import { toBehaviorRequestView } from "~/routes/account_behavior_requests/behavior-request-view";

import type { Route } from "./+types/account-behavior-requests";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "اصلاح رفتار | آموزش K9" }];

/*===== Loader =====*/
/**
 * `now` is taken once here, and every days-left count is worked out from it, so the server and the browser agree on
 * the notches they draw (no hydration mismatch).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const now = new Date();
  const requests = await createServerClient(request).behaviorRequest.listMine();
  // Only a request of this customer's own can be stamped, so a made-up `?sent=` stamps nothing.
  const sent = new URL(request.url).searchParams.get("sent");
  const sentId = requests.some((item) => item.id === sent) ? sent : null;
  return { requests: requests.map((item) => toBehaviorRequestView(item, now)), sentId };
}

/*===== Revalidation =====*/
/**
 * Dropping `?sent=` from the URL must not refetch: the loader would answer without `sentId` and the stamp would vanish
 * the moment it landed. Every other revalidation (after a withdrawal or a payment attempt) keeps the default.
 */
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  const onlySentDropped =
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.searchParams.has("sent") &&
    !nextUrl.searchParams.has("sent");
  return onlySentDropped ? false : defaultShouldRevalidate;
}

/*===== Page =====*/
export default function BehaviorRequestsPage({ loaderData }: Route.ComponentProps) {
  const { requests } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();

  /*------ The Stamp ------*/
  // Kept in state, not read from the loader on every render: the URL loses `sent` right after mount, and the card
  // must keep its place and its stamp for the rest of the visit.
  const [stampedId] = useState(loaderData.sentId);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has("sent")) return;
    params.delete("sent");
    const search = params.toString();
    // Replace, so Back doesn't return to the URL that stamps again.
    void navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true, preventScrollReset: true },
    );
  }, [location.pathname, location.search, navigate]);

  /*------ Groups ------*/
  // In progress: the request just sent goes first, the rest newest first. The API lists newest first already.
  const inProgress = requests
    .filter((request) => request.status === "submitted" || request.status === "proposed")
    .sort(
      (a, b) =>
        Number(b.id === stampedId) - Number(a.id === stampedId) || b.createdAt.getTime() - a.createdAt.getTime(),
    );
  const past = requests
    .filter((request) => request.status !== "submitted" && request.status !== "proposed")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const isEmpty = requests.length === 0;

  return (
    <div className="site-container py-8 lg:py-12">
      {/*===== Header =====*/}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
        <div>
          <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">اصلاح رفتار</h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            مشکل‌هایی که برای آرمان فرستاده‌ای و برنامه‌ای که برایشان داده.
          </p>
        </div>

        {/* The empty state has its own, gold-leaf button; two calls to the same action would compete. */}
        {!isEmpty && (
          <Link
            to="/behavior-modification"
            className={buttonVariants({ variant: "outline", className: "sm:shrink-0" })}
          >
            درخواست تازه
          </Link>
        )}
      </header>

      {isEmpty ? (
        <RequestsEmpty />
      ) : (
        <div className="flex flex-col gap-12">
          {/*===== In Progress =====*/}
          <section aria-labelledby="in-progress-title">
            <h2 id="in-progress-title" className="mb-4 text-lg font-extrabold">
              در جریان
            </h2>
            {inProgress.length > 0 ? (
              <ul className="flex flex-col gap-6">
                {inProgress.map((request) => (
                  <RequestCard key={request.id} request={request} stamped={request.id === stampedId} />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">کاری در جریان نیست.</p>
            )}
          </section>

          {/*===== Past =====*/}
          {past.length > 0 && (
            <section aria-labelledby="past-title">
              <h2 id="past-title" className="mb-4 text-lg font-extrabold">
                قبلی‌ها
              </h2>
              <RequestLedger requests={past} />
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
    <section aria-labelledby="behavior-requests-error-title" className="site-container py-16">
      <h1 id="behavior-requests-error-title" className="text-2xl font-extrabold">
        درخواست‌های اصلاح رفتارت بالا نیامد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد و فهرست باز نشد. درخواست‌هایت سر جایشان هستند؛ دوباره امتحان کن.
      </p>
      <Link
        to="/account/behavior-requests"
        reloadDocument
        className={buttonVariants({ variant: "outline", className: "mt-6" })}
      >
        دوباره امتحان کن
      </Link>
    </section>
  );
}
