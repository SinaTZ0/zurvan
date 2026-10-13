import { ORPCError } from "@orpc/client";
import { cn } from "cn";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { data, isRouteErrorResponse, useNavigation, useRevalidator } from "react-router";

import { getDogEvaluationState } from "~/components/dog-evaluation-stamp";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import { CourseLadder } from "~/routes/admin_dog_detail/components/course-ladder";
import { DetailsSection } from "~/routes/admin_dog_detail/components/details-section";
import { DogHeader } from "~/routes/admin_dog_detail/components/dog-header";
import { EditSheet } from "~/routes/admin_dog_detail/components/edit-sheet";
import { EnrollmentsSection } from "~/routes/admin_dog_detail/components/enrollments-section";
import { EvaluateDialog } from "~/routes/admin_dog_detail/components/evaluate-dialog";
import { EvaluationCard } from "~/routes/admin_dog_detail/components/evaluation-card";
import { EvaluationsSection } from "~/routes/admin_dog_detail/components/evaluations-section";
import { IdentityPanel } from "~/routes/admin_dog_detail/components/identity-panel";
import { summarizeEvaluations } from "~/routes/admin_dog_detail/evaluation-summary";
import { buildLadder } from "~/routes/admin_dog_detail/ladder";
import { ADMIN_DOGS_PATH, adminDogDetailSearchParams } from "~/routes/admin_dog_detail/search-params";

import type { Route } from "./+types/admin-dog-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `${loaderData?.dog.name ?? "سگ"} | مدیریت آموزش K9` },
];

/*===== Loader =====*/
// The admin layout guards the route. The API answers NOT_FOUND for a made-up or malformed id, which becomes a 404.
export async function loader({ request, params }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const dogId = params.dogId;

  const [dog, eligibility, evaluations, enrollments] = await Promise.all([
    client.dog.admin.get({ id: dogId }),
    client.checkout.admin.dogEligibility({ dogId }),
    client.evaluation.admin.list({ dogId }),
    client.enrollment.admin.list({ dogId }),
  ]).catch((error: unknown) => {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
    throw error;
  });

  return { dog, eligibility, evaluations, enrollments };
}

/*===== Admin Dog Detail =====*/
/**
 * One dog, for the Admin (F2, F3, F4): its details to correct, what he already knows about it (evaluated, courses
 * passed), and why it can or can't take each course. Desktop puts the identity and evaluation in a sticky start column
 * beside the ladder, enrollments, evaluations and details; phones read them in that order.
 */
export default function AdminDogDetailPage({ loaderData }: Route.ComponentProps) {
  const { dog, eligibility, evaluations, enrollments } = loaderData;

  /*------ URL State ------*/
  const [{ edit }, setParams] = useQueryStates(adminDogDetailSearchParams);

  /*------ Evaluate Dialog ------*/
  const [evaluating, setEvaluating] = useState(false);

  /*------ Busy ------*/
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== "idle" || revalidator.state !== "idle";

  /*------ Derived ------*/
  const { waiting, evaluated } = summarizeEvaluations(evaluations);
  const stamp = getDogEvaluationState({ isEvaluated: dog.isEvaluated, hasWaitingRequest: waiting !== null });
  const rungs = buildLadder({ eligibility, passedCourses: dog.passedCourses });

  return (
    <div>
      <DogHeader dog={dog} onEdit={() => setParams({ edit: true })} />

      <div
        aria-busy={busy}
        className={cn("grid gap-6 transition-opacity lg:grid-cols-12 lg:items-start lg:gap-x-8", busy && "opacity-60")}
      >
        {/*===== Identity and Evaluation =====*/}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:col-span-5">
          <IdentityPanel dog={dog} state={stamp} />
          <EvaluationCard
            isEvaluated={dog.isEvaluated}
            evaluated={evaluated}
            waiting={waiting}
            onEvaluate={() => setEvaluating(true)}
          />
        </div>

        {/*===== Courses, Enrollments, Evaluations, Details =====*/}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <CourseLadder dog={dog} rungs={rungs} />
          <EnrollmentsSection enrollments={enrollments} />
          <EvaluationsSection evaluations={evaluations} />
          <DetailsSection dog={dog} />
        </div>
      </div>

      {/*===== Edit Sheet =====*/}
      <EditSheet
        dog={dog}
        open={edit}
        // Closing replaces the entry: the open state was pushed so Back closes it, but a close button must not leave a
        // forward entry that reopens it.
        onClose={() => setParams({ edit: null }, { history: "replace" })}
      />

      {/*===== Evaluate Dialog =====*/}
      <EvaluateDialog dog={dog} hasWaitingRequest={waiting !== null} open={evaluating} onOpenChange={setEvaluating} />
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the admin layout, so the rail and the way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-dog-error-title" className="py-10">
      <h1 id="admin-dog-error-title" className="text-2xl font-extrabold">
        {notFound ? "این سگ پیدا نشد" : "سگ باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید از فهرست برداشته شده باشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link to={notFound ? ADMIN_DOGS_PATH : "/admin"} className={buttonVariants({ size: "lg", className: "mt-6" })}>
        {notFound ? "همه‌ی سگ‌ها" : "برگرد به مدیریت"}
      </Link>
    </section>
  );
}
