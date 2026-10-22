import { createFileRoute, notFound, useLocation } from "@tanstack/react-router";

import { Link } from "~/components/link";
import { NotFoundPage } from "~/components/not-found-page";
import { buttonVariants } from "~/components/ui/button";

/*===== Route =====*/
// Nothing lives here: a real 404 status, rendered by `notFoundComponent` inside the public shell.
export const Route = createFileRoute("/_public/$")({
  loader: () => {
    throw notFound();
  },
  head: () => ({ meta: [{ title: "پیدا نشد | زروان" }, { name: "robots", content: "noindex" }] }),
  component: NotFoundPage,
  notFoundComponent: NotFoundPage,
  errorComponent: NotFoundError,
});

/*===== Error Boundary =====*/
// Renders inside the public layout, so the header and footer stay. A 404 is the page's whole point
// (`notFoundComponent`); anything else is a real failure, so it gets a short message and a retry (a full page load, as
// on the catalogue).
function NotFoundError() {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section aria-labelledby="not-found-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="not-found-error-title" className="font-display text-h1 font-black text-balance">
          یه مشکلی پیش اومد
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={href} className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </a>
          <Link to="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
            صفحه‌ی اول
          </Link>
        </div>
      </div>
    </section>
  );
}
