import { ORPCError } from "@orpc/client";
import { data } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { sessionContext } from "~/lib/session-guard.server";
import type { BookingOptions } from "~/orpc/order/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { BookingForm } from "~/routes/account_book/components/booking-form";
import { BookingHeader } from "~/routes/account_book/components/booking-header";
import { NotCustomerPanel } from "~/routes/account_book/components/not-customer-panel";
import { UnavailablePanel } from "~/routes/account_book/components/unavailable-panel";
import type { DeskRouteHandle } from "~/routes/layout_account/components/bottom-tabs";

import type { Route } from "./+types/account-book";

/*===== Handle =====*/
// A focused step with its own fixed bar on phones, so the account's bottom tabs step aside.
export const handle: DeskRouteHandle = { hideBottomTabs: true };

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title:
      loaderData?.kind === "customer"
        ? `${loaderData.options.kind === "test" ? "تست" : "رزرو"} ${loaderData.options.course.title} | آموزش K9`
        : "رزرو دوره | آموزش K9",
  },
];

/*===== Loader =====*/
// The account guard lets trainers and partners in too, and the booking API is for customers: they get a short panel
// instead of an error.
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  if (user.role !== "customer") return { kind: "other" as const, isTrainer: user.role === "trainer" };

  const url = new URL(request.url);
  const courseKind = url.searchParams.get("kind") === "test" ? "test" : "course";
  const client = createServerClient(request);

  const options = await client.order
    .bookingOptions({ courseSlug: params.courseSlug, kind: courseKind })
    .catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    });

  return {
    kind: "customer" as const,
    options,
    initialDogId: pickInitialDog({ options, requestedId: url.searchParams.get("dog") }),
    assessmentId: url.searchParams.get("assessment"),
  };
}

/** The dog the form starts on: the one named by `?dog=` if it can book this, or the only one that can. */
function pickInitialDog({ options, requestedId }: { options: BookingOptions; requestedId: string | null }) {
  const eligible = options.dogs.filter((entry) => entry.eligible);
  const requested = eligible.find((entry) => entry.dog.id === requestedId);
  if (requested) return requested.dog.id;
  return eligible.length === 1 ? (eligible[0]?.dog.id ?? "") : "";
}

/*===== Page =====*/
export default function BookCoursePage({ loaderData }: Route.ComponentProps) {
  if (loaderData.kind === "other") return <NotCustomerPanel isTrainer={loaderData.isTrainer} />;

  const { options } = loaderData;

  return (
    <>
      <BookingHeader course={options.course} kind={options.kind} />

      {options.unavailableReason ? (
        <UnavailablePanel options={options} />
      ) : (
        // Keyed by the preselected dog and the kind: coming back from the Dog Form with a new `?dog=`, or switching to
        // the test, starts the form afresh.
        <BookingForm
          key={`${options.kind}:${loaderData.initialDogId}`}
          options={options}
          initialDogId={loaderData.initialDogId}
          assessmentId={loaderData.assessmentId}
        />
      )}
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the tabs and the way out stay on screen.
export function ErrorBoundary() {
  return (
    <section aria-labelledby="book-error-title" className="site-container py-16">
      <h1 id="book-error-title" className="text-2xl font-extrabold">
        صفحه‌ی رزرو باز نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        این دوره پیدا نشد یا مشکلی پیش آمد. به صفحه‌ی دوره‌ها برگرد یا چند لحظه‌ی دیگر دوباره امتحان کن.
      </p>
      <Link to="/#courses" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        دوره‌ها را ببین
      </Link>
    </section>
  );
}
