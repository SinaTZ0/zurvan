import { ORPCError } from "@orpc/client";
import { cn } from "cn";
import { data, isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { createServerClient } from "~/orpc/server-client.server";
import { AnswerBar } from "~/routes/trainer_behavior_request_detail/components/answer-bar";
import { AnswerCard } from "~/routes/trainer_behavior_request_detail/components/answer-card";
import { RequestHeader } from "~/routes/trainer_behavior_request_detail/components/request-header";
import { TheCase } from "~/routes/trainer_behavior_request_detail/components/the-case";

import type { Route } from "./+types/trainer-behavior-request-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData ? `درخواست ${loaderData.behaviorRequest.dog.name} | آموزش K9` : "درخواست اصلاح رفتار | آموزش K9",
  },
];

/*===== Loader =====*/
export async function loader({ request, params }: Route.LoaderArgs) {
  const api = createServerClient(request);

  // NOT_FOUND covers an unknown id, a malformed one and another trainer's request alike, so the page never confirms
  // that one exists.
  const behaviorRequest = await api.behaviorRequest.trainer.get({ id: params.requestId }).catch((error: unknown) => {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
    throw error;
  });

  // Sent with the loader so the server and the browser count the same days; a reload after an answer re-reads it.
  return { behaviorRequest, now: new Date() };
}

/*===== Page =====*/
export default function TrainerBehaviorRequestDetailPage({ loaderData }: Route.ComponentProps) {
  const { behaviorRequest, now } = loaderData;

  return (
    <div className={cn("site-container py-8 lg:py-12", behaviorRequest.canAnswer && "pb-28 lg:pb-12")}>
      <RequestHeader behaviorRequest={behaviorRequest} />

      {/*===== Page =====*/}
      {/* The case comes first on a phone: the trainer watches before answering. On desktop the answer stays beside it. */}
      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16">
        {/*------ The Case ------*/}
        <div className="lg:col-span-7">
          <TheCase behaviorRequest={behaviorRequest} />
        </div>

        {/*------ The Answer ------*/}
        <div className="lg:sticky lg:top-8 lg:col-span-5">
          <AnswerCard key={behaviorRequest.status} behaviorRequest={behaviorRequest} now={now} />
        </div>
      </div>

      {behaviorRequest.canAnswer && <AnswerBar />}
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the trainer shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="behavior-request-error-title" className="site-container py-16">
      <h1 id="behavior-request-error-title" className="text-2xl font-extrabold">
        {notFound ? "این درخواست پیدا نشد." : "صفحه‌ی درخواست باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید لینک درست نباشد یا این درخواست برای تو نباشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link
        to="/trainer/behavior-requests"
        className="mt-6 inline-block font-bold text-primary underline-offset-4 hover:underline"
      >
        برگرد به درخواست‌ها
      </Link>
    </section>
  );
}
