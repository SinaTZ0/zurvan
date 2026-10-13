import { PlusIcon } from "lucide-react";
import { isRouteErrorResponse } from "react-router";

import { ChalkDoodle } from "~/components/chalk-doodle";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { getDogStatus } from "~/lib/dog-status";
import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { DogCard } from "~/routes/account_home/components/dog-card";
import { NoDogs } from "~/routes/account_home/components/no-dogs";

import type { Route } from "./+types/account-home";

/*===== Guard =====*/
// The account layout lets partners in too, but my dogs, requests and courses are a customer's (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "سگ‌های من | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [dogs, evaluations, enrollments] = await Promise.all([
    client.dog.list(),
    client.evaluation.listMine({}),
    client.enrollment.listMine({}),
  ]);

  /*------ One Card per Dog ------*/
  const cards = dogs.map((dog) => ({
    dog,
    status: getDogStatus({ dog, evaluations, enrollments }),
    activeEnrollments: enrollments.filter(
      (enrollment) => enrollment.dog.id === dog.id && enrollment.status === "active",
    ),
  }));

  /*------ Order ------*/
  // A request waiting for the Admin goes first; it is the dog the owner is most likely to look for. Then newest first.
  cards.sort(
    (a, b) =>
      Number(b.status.waitingEvaluation !== null) - Number(a.status.waitingEvaluation !== null) ||
      b.dog.createdAt.getTime() - a.dog.createdAt.getTime(),
  );

  return { cards };
}

/*===== Dashboard =====*/
/**
 * F2/F3/F6's customer home: one card per dog, each saying where the dog stands and offering the one next step. Open
 * requests and enrollments belong to their dog's card instead of sections of their own.
 */
export default function AccountHomePage({ loaderData }: Route.ComponentProps) {
  const { cards } = loaderData;

  return (
    <div className="site-container py-8 lg:py-14">
      {/*===== Header =====*/}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 lg:mb-10">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-h1 font-black text-balance">سگ‌های من</h1>
          <ChalkDoodle name="paw" className="w-9 -rotate-12 lg:w-11" />
        </div>
        <Link to="/account/dogs/new" className={buttonVariants({ variant: "outline" })}>
          <PlusIcon aria-hidden />
          معرفی سگ تازه
        </Link>
      </header>

      {/*===== Dogs =====*/}
      {cards.length === 0 ? (
        <NoDogs />
      ) : (
        <div className="flex flex-col gap-6 lg:gap-8">
          {cards.map(({ dog, status, activeEnrollments }) => (
            <DogCard key={dog.id} dog={dog} status={status} activeEnrollments={activeEnrollments} />
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
    <section aria-labelledby="account-home-error-title" className="site-container py-16">
      <h1 id="account-home-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "سگ‌هایت باز نشدند"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به صفحه‌ی اصلی
      </Link>
    </section>
  );
}
