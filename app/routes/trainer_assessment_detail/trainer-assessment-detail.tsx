import { ORPCError } from "@orpc/client";
import { cn } from "cn";
import { data, isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { createServerClient } from "~/orpc/server-client.server";
import { AssessmentHeader } from "~/routes/trainer_assessment_detail/components/assessment-header";
import { BeforeYouGo } from "~/routes/trainer_assessment_detail/components/before-you-go";
import { OutcomePanel } from "~/routes/trainer_assessment_detail/components/outcome-panel";

import type { Route } from "./+types/trainer-assessment-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `ارزیابی ${loaderData.assessment.dog.name} | آموزش K9` : "ارزیابی | آموزش K9" },
];

/*===== Loader =====*/
export async function loader({ request, params }: Route.LoaderArgs) {
  const api = createServerClient(request);

  // The API answers NOT_FOUND for an unknown id, a malformed one and another trainer's assessment alike, so the page
  // never confirms that one exists.
  const assessment = await api.assessment.trainer.get({ id: params.assessmentId }).catch((error: unknown) => {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
    throw error;
  });

  // The picker only matters while an outcome can still be written or previewed. Behavior modification starts from a
  // request with a video, never from an assessment, so it is not offered.
  const courses =
    assessment.status === "booked"
      ? (await api.course.list())
          .filter((course) => course.bookingKind !== "behavior-request")
          .map(({ slug, title, latinName }) => ({ slug, title, latinName }))
      : [];

  return { assessment, courses };
}

/*===== Page =====*/
export default function TrainerAssessmentDetailPage({ loaderData }: Route.ComponentProps) {
  const { assessment, courses } = loaderData;
  // Standing at the door, the trainer wants the form first on a phone; before the meeting, the dog.
  const outcomeFirst = assessment.canRecordOutcome;

  return (
    <div className="site-container py-8 lg:py-12">
      <AssessmentHeader assessment={assessment} />

      {/*===== Page =====*/}
      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16">
        {/*------ Before You Go ------*/}
        <div className="lg:col-span-5">
          <BeforeYouGo assessment={assessment} />
        </div>

        {/*------ The Outcome ------*/}
        <OutcomePanel
          assessment={assessment}
          courses={courses}
          className={cn("lg:sticky lg:top-8 lg:col-span-7", outcomeFirst && "order-first lg:order-none")}
        />
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the trainer shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="assessment-error-title" className="site-container py-16">
      <h1 id="assessment-error-title" className="text-2xl font-extrabold">
        {notFound ? "این ارزیابی پیدا نشد" : "صفحه‌ی ارزیابی باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید لینک درست نباشد یا این ارزیابی برای تو نباشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link to="/trainer" className="mt-6 inline-block font-bold text-primary underline-offset-4 hover:underline">
        برگرد به برنامه‌ی من
      </Link>
    </section>
  );
}
