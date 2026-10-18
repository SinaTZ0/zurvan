import { isRouteErrorResponse, useLocation } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { isShownFamily } from "~/lib/course-families";
import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { BuyCourseRow } from "~/routes/buy/components/buy-course-row";
import { BuyDogPicker } from "~/routes/buy/components/buy-dog-picker";
import { CartBar } from "~/routes/buy/components/cart-bar";

import type { Route } from "./+types/buy";

/*===== Guard =====*/
// Customers only. A visitor is sent to sign in and brought back here, the query string included (`requireSession`); a
// partner or the Admin goes to their own home.
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "خرید دوره | زروان" },
  { name: "description", content: "اول سگت را انتخاب کن؛ برای هر دوره می‌بینی مناسبش هست یا اول چه کاری لازم است." },
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
 * «خرید دوره»: for people who know what they want. Pick the dog first, then see the courses it can take (with the price
 * and a button) and the ones it can't (with why, and the way out). Adding goes to the cart; «پرداخت» is there.
 */
export default function BuyPage({ loaderData }: Route.ComponentProps) {
  const { dogs, dogId, courses, verdicts } = loaderData;
  const dog = dogs.find((candidate) => candidate.id === dogId) ?? null;

  return (
    <section aria-labelledby="buy-title" className="site-container pt-section-sm pb-section-md">
      <h1 id="buy-title" className="font-display text-h1 font-black text-balance">
        خرید دوره
      </h1>
      <p className="mt-4 max-w-xl text-lead text-pretty text-muted-foreground">
        اول بگو برای کدوم سگ؛ برای هر دوره می‌بینی مناسبشه یا اول چه کاری لازمه.
      </p>

      {/*===== Dog =====*/}
      <div className="mt-10">
        <BuyDogPicker dogs={dogs} dogId={dogId} />
      </div>

      {/*===== Courses =====*/}
      {dog && (
        <div className="mt-12">
          <h2 className="text-h3 font-bold text-balance">دوره‌ها برای {dog.name}</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {courses.map((course) => {
              const verdict = verdicts.find((entry) => entry.courseSlug === course.slug);
              return (
                <BuyCourseRow
                  key={course.slug}
                  course={course}
                  dog={{ id: dog.id, name: dog.name }}
                  verdict={verdict ?? null}
                />
              );
            })}
          </ul>
        </div>
      )}

      <CartBar />
    </section>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { pathname, search } = useLocation();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="buy-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="buy-error-title" className="font-display text-h1 font-black text-balance">
          {notFound ? "این صفحه پیدا نشد" : "صفحه‌ی خرید باز نشد"}
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">
          مشکلی پیش آمد. دوباره امتحان کن یا از صفحه‌ی دوره‌ها شروع کن.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`${pathname}${search}`} reloadDocument className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </Link>
          <Link to="/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
            دوره‌ها
          </Link>
        </div>
      </div>
    </section>
  );
}
