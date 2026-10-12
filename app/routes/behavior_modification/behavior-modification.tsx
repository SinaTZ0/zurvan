import { isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { auth } from "~/lib/auth.server";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { createServerClient } from "~/orpc/server-client.server";
import {
  CourseClosedPanel,
  NotCustomerPanel,
  SignInPanel,
} from "~/routes/behavior_modification/components/access-panels";
import { RequestForm } from "~/routes/behavior_modification/components/request-form";
import { RequestHeader } from "~/routes/behavior_modification/components/request-header";
import { pickInitialDogId } from "~/routes/behavior_modification/dog-choices";

import type { Route } from "./+types/behavior-modification";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: `درخواست اصلاح رفتار برای سگ | آموزش K9` },
  {
    name: "description",
    content: `ویدیوی رفتار سگت را بفرست. ${HEAD_TRAINER.firstName} می‌بیند و با یک برنامه و قیمت جواب می‌دهد. ویدیوها خصوصی می‌مانند.`,
  },
];

/*===== Loader =====*/
// The public layout has no guard, so the page reads the session itself and answers each kind of visitor: signed out,
// signed in but not a customer, and a customer (whose dogs and their blocked reasons come from `behaviorRequest.options`).
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const session = await auth.api.getSession({ headers: request.headers });
  // Back here with the query kept, so a `?dog=` link survives the sign-in.
  const signInHref = `/auth?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;

  // Blocked accounts and new ones that haven't given their name are sent through sign-in, as every guard does.
  const user = session && session.user.status !== "blocked" && session.user.firstName ? session.user : null;

  if (!user) return { kind: "guest" as const, signInHref };
  if (user.role !== "customer") {
    return { kind: "other" as const, isTrainer: user.role === "trainer" || user.role === "admin", signInHref };
  }

  const options = await createServerClient(request).behaviorRequest.options();
  return {
    kind: "customer" as const,
    options,
    initialDogId: pickInitialDogId({
      dogs: options.dogs,
      requestedId: url.searchParams.get("dog"),
    }),
  };
}

/*===== Page =====*/
export default function BehaviorModificationPage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <RequestHeader />

      {loaderData.kind === "customer" ? (
        loaderData.options.course ? (
          // Keyed by the preselected dog: a new `?dog=` (coming back from the Dog Form) starts the form on that dog.
          <RequestForm
            key={loaderData.initialDogId}
            dogs={loaderData.options.dogs}
            initialDogId={loaderData.initialDogId}
          />
        ) : (
          <div className="site-container pt-10 pb-16 lg:pb-20">
            <div className="max-w-[44rem]">
              <CourseClosedPanel />
            </div>
          </div>
        )
      ) : (
        <div className="site-container pt-10 pb-16 lg:pb-20">
          <div className="max-w-[44rem]">
            {loaderData.kind === "guest" ? (
              <SignInPanel signInHref={loaderData.signInHref} />
            ) : (
              <NotCustomerPanel isTrainer={loaderData.isTrainer} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the public layout, so the header and footer stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="behavior-request-error-title" className="site-container py-16">
      <h1 id="behavior-request-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "صفحه‌ی درخواست باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد و صفحه باز نشد. چند لحظه‌ی دیگر دوباره امتحان کن.
      </p>
      <Link
        to="/behavior-modification"
        reloadDocument
        className={buttonVariants({ variant: "outline", className: "mt-6" })}
      >
        دوباره امتحان کن
      </Link>
    </section>
  );
}
