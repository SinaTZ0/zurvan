import { ORPCError } from "@orpc/client";
import { cn } from "cn";
import { data, isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { createServerClient } from "~/orpc/server-client.server";
import { AboutTheDog } from "~/routes/trainer_enrollment_detail/components/about-the-dog";
import { CancelEnrollment } from "~/routes/trainer_enrollment_detail/components/cancel-enrollment";
import { EnrollmentHeader } from "~/routes/trainer_enrollment_detail/components/enrollment-header";
import { ResultSection } from "~/routes/trainer_enrollment_detail/components/result-section";
import { SessionCardEditor } from "~/routes/trainer_enrollment_detail/components/session-card-editor";

import type { Route } from "./+types/trainer-enrollment-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `آموزش ${loaderData.enrollment.dog.name} | آموزش K9` : "آموزش | آموزش K9" },
];

/*===== Loader =====*/
export async function loader({ request, params }: Route.LoaderArgs) {
  const api = createServerClient(request);

  // The API answers NOT_FOUND for an unknown id, a malformed one and another trainer's enrollment alike, so the page
  // never confirms that one exists.
  const enrollment = await api.enrollment.trainer.get({ id: params.enrollmentId }).catch((error: unknown) => {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
    throw error;
  });

  // `now` travels with the data so the server and the browser agree on what is overdue and on the test cut-off.
  return { enrollment, now: new Date() };
}

/*===== Page =====*/
export default function TrainerEnrollmentDetailPage({ loaderData }: Route.ComponentProps) {
  const { enrollment, now } = loaderData;
  // Waiting for a first session, the trainer wants the owner's phone and times first; once training, the card.
  const cardFirst = enrollment.status === "active";

  return (
    <div className="site-container py-8 lg:py-12">
      <EnrollmentHeader enrollment={enrollment} />

      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16">
        {/*------ The Dog ------*/}
        <div className="lg:col-span-5">
          <AboutTheDog enrollment={enrollment} />
        </div>

        {/*------ Sessions, Result, Cancel ------*/}
        <div
          className={cn(
            "flex flex-col gap-8 rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-8 lg:col-span-7 lg:p-7",
            cardFirst && "order-first lg:order-none",
          )}
        >
          <SessionCardEditor enrollment={enrollment} now={now} />

          <div className="border-t pt-8">
            <ResultSection enrollment={enrollment} />
          </div>

          {enrollment.canSchedule && (
            <div className="flex flex-col gap-3 border-t pt-6">
              <p className="text-sm text-pretty text-muted-foreground">
                اگر آموزش ادامه پیدا نمی‌کند، می‌توانی آن را لغو کنی.
              </p>
              <CancelEnrollment enrollment={enrollment} now={now} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the trainer shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="enrollment-error-title" className="site-container py-16">
      <h1 id="enrollment-error-title" className="text-2xl font-extrabold">
        {notFound ? "این آموزش پیدا نشد" : "صفحه‌ی آموزش باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید لینک درست نباشد یا این آموزش برای تو نباشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link
        to="/trainer/enrollments"
        className="mt-6 inline-block font-bold text-primary underline-offset-4 hover:underline"
      >
        برگرد به شاگردها
      </Link>
    </section>
  );
}
