import { cn } from "cn";
import { isRouteErrorResponse, useNavigation } from "react-router";

import { isShownFamily } from "~/lib/course-families";
import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { splitCourses } from "~/routes/buy/buy-lists";
import { BuyError } from "~/routes/buy/components/buy-error";
import { BuyHero } from "~/routes/buy/components/buy-hero";
import { CanTakeSection } from "~/routes/buy/components/can-take-section";
import { CartBar } from "~/routes/buy/components/cart-bar";
import { GatePanel } from "~/routes/buy/components/gate-panel";
import { LaterSection } from "~/routes/buy/components/later-section";
import { NoDogsPanel } from "~/routes/buy/components/no-dogs-panel";
import { PageEnd } from "~/routes/buy/components/page-end";
import { PageMotion } from "~/routes/buy/components/page-motion";
import { PickFirstPanel } from "~/routes/buy/components/pick-first-panel";
import { useChanged } from "~/routes/buy/hooks/use-changed";
import { COLUMN } from "~/routes/buy/plate";
import type { PublicLayoutHandle } from "~/routes/layout_public/layout-public";

import type { Route } from "./+types/buy";

/*===== Handle =====*/
// The page ends on a stretch of path that runs straight into the footer: the public shell drops `main`'s bottom
// padding when a page's handle sets this.
export const handle: PublicLayoutHandle = { flushFooter: true };

/*===== Guard =====*/
// Customers only. A visitor is sent to sign in and brought back here, the query string included (`requireSession`); a
// partner or the Admin goes to their own home.
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "خرید دوره | آموزش K9" },
  { name: "description", content: "اول سگت رو انتخاب کن؛ برای هر دوره می‌بینی مناسبشه یا اول چی لازمه." },
];

/*===== Headers =====*/
// The page lists someone's own dogs and what each can take, so no shared cache may keep it (the public layout sets none).
export const headers: Route.HeadersFunction = ({ parentHeaders }) => {
  const result = new Headers(parentHeaders);
  result.set("Cache-Control", "private, no-store");
  return result;
};

/*===== Loader =====*/
/**
 * The purchase page that starts from the dog (docs/app-spec.md, F5). The dog is `?dog=<id>`; with exactly one dog it is
 * chosen already. The verdict for every course comes from the server's eligibility check, the same one the cart and
 * «پرداخت» use, so nothing is offered that couldn't be bought. A dog that isn't the customer's is just not picked.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [dogs, courses] = await Promise.all([client.dog.list(), client.course.list()]);

  const asked = new URL(request.url).searchParams.get("dog");
  const dog = dogs.find((candidate) => candidate.id === asked) ?? (dogs.length === 1 ? dogs[0] : undefined);

  const verdicts = dog ? await client.checkout.dogCourses({ dogId: dog.id }) : [];

  return {
    dogs,
    dogId: dog?.id ?? null,
    courses: courses.filter((course) => isShownFamily(course.family)),
    verdicts,
  };
}

/*===== Page =====*/
/**
 * «خرید دوره»: for people who know what they want (F5). The center's stall: the customer's dogs line up as prints, the
 * picked one steps forward, and the plates below show what fits it: «الان می‌تونه» (price and «افزودن به سبد») and
 * «بعداً باز می‌شن» (each reason and the way out), with a reason every course shares (no evaluation) lifted into a gate
 * first. Adding goes to the cart; «پرداخت» is there, behind the floating cart bar.
 *
 * Picking a dog is a navigation (`?dog=`): while it loads, the pressed print lifts at once (the pending location's dog)
 * and the plates below dim; when it lands, the h1 and the bubbles re-key and the plates arrive staggered.
 */
export default function BuyPage({ loaderData }: Route.ComponentProps) {
  const { dogs, dogId, courses, verdicts } = loaderData;
  const dog = dogs.find((candidate) => candidate.id === dogId) ?? null;
  const lists = dog ? splitCourses({ courses, verdicts, dogId: dog.id }) : null;
  const changed = useChanged(dogId ?? "none");

  /*------ The Dog Being Opened ------*/
  const navigation = useNavigation();
  const pending =
    navigation.state === "loading" && navigation.location.pathname === "/buy"
      ? new URLSearchParams(navigation.location.search).get("dog")
      : null;
  const pendingDog = pending ? dogs.find((candidate) => candidate.id === pending) : undefined;
  const pickedId = pendingDog?.id ?? dogId;
  const loading = pendingDog !== undefined && pendingDog.id !== dogId;

  return (
    <>
      <PageMotion />

      {/*===== Hero: the Stall and the Line-up =====*/}
      <BuyHero
        dogs={dogs}
        pickedId={pickedId}
        dogName={dog?.name ?? null}
        pickBubble={dog && lists && !loading ? { dogId: dog.id, line: lists.line, changed } : null}
        changed={changed}
      />

      {/*===== What Fits =====*/}
      <div
        key={dogId ?? "none"}
        className={cn(
          COLUMN,
          "mt-10 flex flex-col gap-y-14 motion-safe:transition-opacity motion-safe:duration-300 lg:mt-14 lg:gap-y-20",
          loading && "opacity-45",
        )}
      >
        {dogs.length === 0 ? (
          <NoDogsPanel />
        ) : !dog || !lists ? (
          <PickFirstPanel />
        ) : (
          <>
            {lists.gate && <GatePanel gate={lists.gate} arrive={changed} />}
            {/* A dog with nothing to buy now has no offer plate: the gate (or the list of reasons) leads. */}
            {lists.canTake.length > 0 && (
              <CanTakeSection courses={lists.canTake} dogId={dog.id} dogName={dog.name} arrive={changed} />
            )}
            {lists.later.length > 0 && (
              <LaterSection
                rows={lists.later}
                gated={lists.gate !== null}
                arrive={changed}
                delay={lists.canTake.length > 0 ? 160 : 80}
              />
            )}
          </>
        )}
      </div>

      <PageEnd />
      <CartBar />
    </>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <BuyError notFound={isRouteErrorResponse(error) && error.status === 404} />;
}
