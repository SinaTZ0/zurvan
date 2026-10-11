import { isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { auth } from "~/lib/auth.server";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { createServerClient } from "~/orpc/server-client.server";
import { BookingForm } from "~/routes/assessment/components/booking-form";
import { BookingHeader } from "~/routes/assessment/components/booking-header";
import { VisitorBooking } from "~/routes/assessment/components/visitor-booking";
import { pickInitialDog, toDogChoices } from "~/routes/assessment/dog-choices";

import type { Route } from "./+types/assessment";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: `ارزیابی رایگان با ${HEAD_TRAINER.firstName} | آموزش K9` },
  {
    name: "description",
    content: `یک ساعت با سگت، در خانه‌ی خودت یا بیرون. ${HEAD_TRAINER.firstName} سگت را می‌بیند و می‌گوید از کدام دوره شروع کنید. رایگان است.`,
  },
];

/*===== Loader =====*/
// The public layout has no guard, so the page reads the session itself and answers each kind of visitor:
// signed out (a diary to look at and a way in), signed in but not a customer (a note, and the schedule for
// trainers), and a customer (their dogs, to pick one).
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const client = createServerClient(request);
  const session = await auth.api.getSession({ headers: request.headers });
  // Back here with the query kept, so a `?dog=` link survives the sign-in.
  const signInHref = `/auth?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;

  // Blocked accounts and new ones that haven't given their name are sent through sign-in, as every guard does.
  const user = session && session.user.status !== "blocked" && session.user.firstName ? session.user : null;

  if (!user) {
    return { kind: "guest" as const, signInHref, slots: await client.assessment.availableSlots() };
  }

  if (user.role !== "customer") {
    return {
      kind: "other" as const,
      isTrainer: user.role === "trainer" || user.role === "admin",
      signInHref,
      slots: await client.assessment.availableSlots(),
    };
  }

  const [slots, dogs, assessments] = await Promise.all([
    client.assessment.availableSlots(),
    client.dog.list(),
    client.assessment.listMine({}),
  ]);
  const choices = toDogChoices({ dogs, assessments });

  return {
    kind: "customer" as const,
    slots,
    choices,
    initialDogId: pickInitialDog({ choices, requestedId: url.searchParams.get("dog") }),
  };
}

/*===== Page =====*/
export default function BookAssessmentPage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <BookingHeader />

      {loaderData.kind === "customer" ? (
        // Keyed by the preselected dog: a new `?dog=` (coming back from the Dog Form) starts the form on that dog.
        <BookingForm
          key={loaderData.initialDogId}
          choices={loaderData.choices}
          slots={loaderData.slots}
          initialDogId={loaderData.initialDogId}
        />
      ) : (
        <VisitorBooking
          slots={loaderData.slots}
          signInHref={loaderData.signInHref}
          viewer={loaderData.kind === "guest" ? { kind: "guest" } : { kind: "other", isTrainer: loaderData.isTrainer }}
        />
      )}
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the public layout, so the header and footer stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="assessment-error-title" className="site-container py-16">
      <h1 id="assessment-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "وقت‌های آرمان بالا نیامد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد و صفحه باز نشد. چند لحظه‌ی دیگر دوباره امتحان کن.
      </p>
      <Link to="/assessment" reloadDocument className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        دوباره امتحان کن
      </Link>
    </section>
  );
}
