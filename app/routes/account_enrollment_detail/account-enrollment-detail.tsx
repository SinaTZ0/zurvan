import { ORPCError } from "@orpc/client";
import { ChevronRightIcon } from "lucide-react";
import { data, isRouteErrorResponse } from "react-router";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { SessionCard } from "~/components/session-card";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { describeNextStep, enrollmentTitle } from "~/lib/enrollment-format";
import { createServerClient } from "~/orpc/server-client.server";
import { AssessmentDogMark } from "~/routes/account_assessments/components/assessment-dog";
import { CancelEnrollment } from "~/routes/account_enrollment_detail/components/cancel-enrollment";
import { EndingBlock } from "~/routes/account_enrollment_detail/components/ending-block";
import { EnrollmentDetails } from "~/routes/account_enrollment_detail/components/enrollment-details";
import { SessionList } from "~/routes/account_enrollment_detail/components/session-list";

import type { Route } from "./+types/account-enrollment-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData?.enrollment
      ? `${enrollmentTitle(loaderData.enrollment)} · ${loaderData.enrollment.dog.name} | آموزش K9`
      : "آموزش‌ها | آموزش K9",
  },
];

/*===== Loader =====*/
export async function loader({ request, params }: Route.LoaderArgs) {
  // The API answers NOT_FOUND for a missing or someone else's enrollment alike, so the page never confirms that one
  // exists.
  const enrollment = await createServerClient(request)
    .enrollment.get({ id: params.enrollmentId })
    .catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    });
  return { enrollment };
}

/*===== Page =====*/
export default function EnrollmentDetailPage({ loaderData }: Route.ComponentProps) {
  const { enrollment } = loaderData;
  const live = enrollment.canCancel;
  const isTest = enrollment.kind === "test";
  const hasSessions = enrollment.sessions.length > 0;

  return (
    <div className="site-container py-8 lg:py-12">
      <Link
        to="/account/training"
        className="inline-flex items-center gap-1 rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        <ChevronRightIcon aria-hidden className="size-4" />
        آموزش‌ها
      </Link>

      {/*===== Header =====*/}
      <header className="mt-6 flex items-start gap-4 lg:mt-8">
        <AssessmentDogMark dog={enrollment.dog} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl leading-tight font-bold text-balance lg:text-5xl">
            {enrollment.dog.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg text-muted-foreground">
            <span className="text-pretty">
              {enrollmentTitle(enrollment)}
              {enrollment.isRetake && " (دوباره)"}
            </span>
            <EnrollmentStatusBadge status={enrollment.status} />
          </p>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16">
        {/*===== The Course =====*/}
        <div className="flex flex-col gap-10 lg:col-span-7">
          {/*------ Session Card ------*/}
          <section aria-labelledby="card-title">
            <h2 id="card-title" className="sr-only">
              کارت جلسه‌ها
            </h2>
            <SessionCard
              plannedSessions={enrollment.plannedSessions}
              sessions={enrollment.sessions}
              size="full"
              caption={
                <>
                  {!isTest && (
                    <span className="block font-bold text-foreground">
                      {formatNumberFa(enrollment.usedSessions)} از {formatNumberFa(enrollment.plannedSessions)} جلسه
                      برگزار شد
                    </span>
                  )}
                  {live && <span className="mt-1 block text-foreground">{describeNextStep({ enrollment })}</span>}
                  {live && enrollment.nextSession && <span className="mt-1 block">{enrollment.nextSession.place}</span>}
                </>
              }
            />
          </section>

          {/*------ Sessions ------*/}
          {hasSessions && (
            <section aria-labelledby="sessions-title">
              <h2 id="sessions-title" className="mb-3 text-lg font-extrabold">
                جلسه‌ها
              </h2>
              <SessionList sessions={enrollment.sessions} address={enrollment.address} />
            </section>
          )}

          {/*------ Ending ------*/}
          <EndingBlock enrollment={enrollment} />
        </div>

        {/*===== Details and Cancel =====*/}
        <div className="flex flex-col gap-10 lg:col-span-5">
          <section aria-labelledby="details-title">
            <h2 id="details-title" className="mb-3 text-lg font-extrabold">
              جزئیات
            </h2>
            <EnrollmentDetails enrollment={enrollment} />
          </section>

          {live && enrollment.refundPreview && (
            <div className="border-t pt-6">
              <CancelEnrollment enrollment={enrollment} preview={enrollment.refundPreview} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="enrollment-error-title" className="site-container py-16">
      <h1 id="enrollment-error-title" className="text-2xl font-extrabold">
        {notFound ? "این آموزش پیدا نشد" : "صفحه‌ی آموزش باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید آدرس درست نباشد یا این آموزش مال حساب دیگری باشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link to="/account/training" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        برگرد به آموزش‌ها
      </Link>
    </section>
  );
}
