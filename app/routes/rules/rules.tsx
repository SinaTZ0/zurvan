import { createFileRoute } from "@tanstack/react-router";
import { data, isRouteErrorResponse, useLocation } from "react-router";

import { Link } from "~/components/link";
import { NotFoundPage } from "~/components/not-found-page";
import { buttonVariants } from "~/components/ui/button";
import { SITE_RULES } from "~/lib/site-rules";
import { RulesArticle } from "~/routes/rules/components/rules-article";

import type { Route } from "./+types/rules";

/*===== Loader =====*/
// There is no page until the owner has approved the wording (`app/lib/site-rules.ts`): a 404, not an empty or invented one.
export function loader() {
  if (!SITE_RULES) throw data(null, { status: 404 });
  return null;
}

/*===== Meta =====*/
// While nothing is published the page is the Not Found page, and its tab says so (it must not hint that rules exist).
export const meta: Route.MetaFunction = () =>
  SITE_RULES
    ? [
        { title: `${SITE_RULES.title} | زروان` },
        { name: "description", content: "قوانین استفاده از سایت و خرید دوره." },
      ]
    : [{ title: "پیدا نشد | زروان" }, { name: "robots", content: "noindex" }];

/*===== Page =====*/
/** The site rules, exactly as published in the registry: a heading per section, its paragraphs, and the version's date. */
export default function RulesPage() {
  // The loader has refused the request when there is nothing to show.
  const rules = SITE_RULES;
  if (!rules) return null;

  return <RulesArticle rules={rules} />;
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so the header and footer stay. The 404 (nothing published yet) is the site's Not
// Found page; anything else is a real failure, with a retry that is a full page load, as on the catalogue.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { pathname, search } = useLocation();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <section aria-labelledby="rules-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="rules-error-title" className="font-display text-h1 font-black text-balance">
          قوانین باز نشد
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`${pathname}${search}`} reloadDocument className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </Link>
          <Link to="/help" className={buttonVariants({ variant: "outline", size: "lg" })}>
            راهنما
          </Link>
        </div>
      </div>
    </section>
  );
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/_public/rules")({});
