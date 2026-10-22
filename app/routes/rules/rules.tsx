import { createFileRoute, notFound, useLocation } from "@tanstack/react-router";

import { Link } from "~/components/link";
import { NotFoundPage } from "~/components/not-found-page";
import { buttonVariants } from "~/components/ui/button";
import { SITE_RULES } from "~/lib/site-rules";
import { RulesArticle } from "~/routes/rules/components/rules-article";

/*===== Route =====*/
// There is no page until the owner has approved the wording (`app/lib/site-rules.ts`): a 404, not an empty or invented
// one. While nothing is published the page is the Not Found page, and its tab says so (it must not hint that rules
// exist).
export const Route = createFileRoute("/_public/rules")({
  loader: () => {
    if (!SITE_RULES) throw notFound();
  },
  head: () => ({
    meta: SITE_RULES
      ? [
          { title: `${SITE_RULES.title} | زروان` },
          { name: "description", content: "قوانین استفاده از سایت و خرید دوره." },
        ]
      : [{ title: "پیدا نشد | زروان" }, { name: "robots", content: "noindex" }],
  }),
  component: RulesPage,
  // Inside the public layout, so the header and footer stay: the site's Not Found page.
  notFoundComponent: NotFoundPage,
  errorComponent: RulesError,
});

/*===== Page =====*/
/** The site rules, exactly as published in the registry: a heading per section, its paragraphs, and the version's date. */
function RulesPage() {
  // The loader has refused the request when there is nothing to show.
  const rules = SITE_RULES;
  if (!rules) return null;

  return <RulesArticle rules={rules} />;
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so the header and footer stay. A real failure (the 404 is `NotFoundPage` above),
// with a retry that is a full page load, as on the catalogue.
function RulesError() {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section aria-labelledby="rules-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="rules-error-title" className="font-display text-h1 font-black text-balance">
          قوانین باز نشد
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={href} className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </a>
          <Link to="/help" className={buttonVariants({ variant: "outline", size: "lg" })}>
            راهنما
          </Link>
        </div>
      </div>
    </section>
  );
}
