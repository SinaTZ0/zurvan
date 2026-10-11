import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { isLiveEnrollment } from "~/lib/enrollment-format";
import { createServerClient } from "~/orpc/server-client.server";
import { FinishedLedger } from "~/routes/account_training/components/finished-ledger";
import { LiveCard } from "~/routes/account_training/components/live-card";
import { TrainingEmpty } from "~/routes/account_training/components/training-empty";

import type { Route } from "./+types/account-training";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "آموزش‌ها | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const enrollments = await createServerClient(request).enrollment.listMine({});
  return { enrollments };
}

/*===== Page =====*/
export default function TrainingPage({ loaderData }: Route.ComponentProps) {
  const { enrollments } = loaderData;

  /*------ Groups ------*/
  // The API lists the newest first. Live ones are ordered by what comes next: the soonest session first, those still
  // waiting for a first session last.
  const live = enrollments
    .filter(isLiveEnrollment)
    .sort(
      (a, b) =>
        (a.nextSession?.startsAt.getTime() ?? Number.POSITIVE_INFINITY) -
        (b.nextSession?.startsAt.getTime() ?? Number.POSITIVE_INFINITY),
    );
  const finished = enrollments.filter((enrollment) => !isLiveEnrollment(enrollment));

  return (
    <div className="site-container py-8 lg:py-12">
      {/*===== Header =====*/}
      <header className="mb-8 lg:mb-10">
        <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">آموزش‌ها</h1>
        <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
          دوره‌ها و تست‌های سگ‌هایت، و جلسه‌ی بعد هر کدام.
        </p>
      </header>

      {enrollments.length === 0 ? (
        <TrainingEmpty />
      ) : (
        <div className="flex flex-col gap-12">
          {/*===== In Progress =====*/}
          <section aria-labelledby="live-title">
            <h2 id="live-title" className="mb-4 text-lg font-extrabold">
              در جریان
            </h2>
            {live.length > 0 ? (
              <ul className="flex max-w-176 flex-col gap-5">
                {live.map((enrollment) => (
                  <LiveCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                آموزشی در جریان نیست.{" "}
                <Link to="/account/dogs" className="font-bold text-primary underline-offset-4 hover:underline">
                  قدم بعدی هر سگ را ببین
                </Link>
              </p>
            )}
          </section>

          {/*===== Finished =====*/}
          {finished.length > 0 && (
            <section aria-labelledby="finished-title">
              <h2 id="finished-title" className="mb-4 text-lg font-extrabold">
                تمام‌شده
              </h2>
              <FinishedLedger enrollments={finished} />
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
    <section aria-labelledby="training-error-title" className="site-container py-16">
      <h1 id="training-error-title" className="text-2xl font-extrabold">
        آموزش‌هایت بالا نیامد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد و فهرست باز نشد. چیزی از آموزش‌هایت گم نشده؛ دوباره امتحان کن.
      </p>
      <Link to="/account/training" reloadDocument className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        دوباره امتحان کن
      </Link>
    </section>
  );
}
