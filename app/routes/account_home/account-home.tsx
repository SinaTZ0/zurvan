import { isRouteErrorResponse } from "react-router";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { getDogStatus } from "~/lib/dog-status";
import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { COLUMN } from "~/routes/account_home/column";
import { DogPanel } from "~/routes/account_home/components/dog-panel";
import { RoadChalk } from "~/routes/account_home/components/dog-road";
import { HomeHero } from "~/routes/account_home/components/home-hero";
import { NextStepsBand } from "~/routes/account_home/components/next-steps-band";
import { NoDogs } from "~/routes/account_home/components/no-dogs";
import type { AccountLayoutHandle } from "~/routes/layout_account/layout-account";

import type { Route } from "./+types/account-home";

/*===== Handle =====*/
// The page ends on its brick band, which runs straight into the footer: the account shell drops `main`'s bottom
// padding when a page's handle sets this.
export const handle: AccountLayoutHandle = { flushFooter: true };

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

  /*------ Tally ------*/
  // The hero's three numbers, from what was read above: only the customer's own dogs' courses.
  const tally = {
    dogs: cards.length,
    training: cards.reduce((sum, card) => sum + card.activeEnrollments.length, 0),
    passed: cards.reduce((sum, card) => sum + card.dog.passedCourses.length, 0),
  };

  return { cards, tally };
}

/*===== Dashboard =====*/
/**
 * F2/F3/F6's customer home, «سگ‌های من»: the center's dog welcomes the customer in front of his friends' board, then one
 * panel per dog, each saying where the dog stands (its bubble and its road) and offering the one next step, and at
 * the end the brick band of what happens from here. Open requests and enrollments belong to their dog's panel instead
 * of sections of their own.
 */
export default function AccountHomePage({ loaderData }: Route.ComponentProps) {
  const { cards, tally } = loaderData;

  return (
    <>
      {/*===== Hero =====*/}
      <HomeHero tally={cards.length > 0 ? tally : null} />

      {/*===== Dogs =====*/}
      <div className={COLUMN}>
        {cards.length === 0 ? (
          <NoDogs />
        ) : (
          <div className="flex flex-col gap-6">
            <RoadChalk />
            {cards.map(({ dog, status, activeEnrollments }, index) => (
              <DogPanel key={dog.id} dog={dog} status={status} activeEnrollments={activeEnrollments} index={index} />
            ))}
          </div>
        )}
      </div>

      {/*===== What Happens From Here =====*/}
      <NextStepsBand />
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so a failed list still has the header, the footer and a way on.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="account-home-error-title" className={`${COLUMN} py-section-md`}>
      <div className="grid items-end gap-y-8 md:grid-cols-[minmax(0,34rem)_16rem] md:gap-x-16">
        {/*------ Words ------*/}
        <div className="max-w-xl md:pb-8">
          <h1 id="account-home-error-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
            {notFound ? "این صفحه پیدا نشد" : "سگ‌هات باز نشدن"}
          </h1>
          <p className="mt-4 text-lead text-pretty text-muted-foreground">
            یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن.
          </p>
          <Link to="/" className={buttonVariants({ variant: "solid", size: "lg", className: "mt-7" })}>
            برگرد به صفحه‌ی اصلی
          </Link>
        </div>

        {/*------ The Sorry Dog ------*/}
        {/* Physical sides: his bubble's tail is aimed at his head, which faces right. */}
        <div aria-hidden className="relative h-56">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_55%_at_50%_80%,rgb(255_194_26/0.08),transparent)]" />
          <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" />
          <div className="absolute bottom-[0.9rem] left-1/2 w-28 -translate-x-1/2 translate-y-[3%]">
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[80%] w-[55%]" />
            <MascotCut name="plants" className="lively-sway-2 absolute right-[84%] bottom-0 w-[45%] -scale-x-100" />
            <MascotCut name="sorry" className="lively-breathe relative block w-full" />
          </div>
          <ChalkBubble tail="right" className="absolute top-0 right-[calc(50%-0.5rem)] text-pretty">
            ببخشید!
          </ChalkBubble>
        </div>
      </div>
    </section>
  );
}
