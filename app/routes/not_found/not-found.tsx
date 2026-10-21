import { data, isRouteErrorResponse, useLocation } from "react-router";

import { Link } from "~/components/link";
import { NotFoundPage } from "~/components/not-found-page";
import { buttonVariants } from "~/components/ui/button";

import type { Route } from "./+types/not-found";

/*===== Loader =====*/
// Nothing lives here: a real 404 status, rendered by the boundary below inside the public shell.
export function loader() {
  throw data(null, { status: 404 });
}

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "پیدا نشد | زروان" }, { name: "robots", content: "noindex" }];

/*===== Page =====*/
export default function NotFoundRoute() {
  return <NotFoundPage />;
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so the header and footer stay. A 404 is the page's whole point; anything else is
// a real failure, so it gets a short message and a retry (a full page load, as on the catalogue).
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { pathname, search } = useLocation();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <section aria-labelledby="not-found-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="not-found-error-title" className="font-display text-h1 font-black text-balance">
          یه مشکلی پیش اومد
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`${pathname}${search}`} reloadDocument className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </Link>
          <Link to="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
            صفحه‌ی اول
          </Link>
        </div>
      </div>
    </section>
  );
}
