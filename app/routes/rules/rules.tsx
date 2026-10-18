import { data } from "react-router";

import { SITE_RULES } from "~/lib/site-rules";

import type { Route } from "./+types/rules";

/*===== Loader =====*/
// There is no page until the owner has approved the wording (`app/lib/site-rules.ts`): a 404, not an empty or invented one.
export function loader() {
  if (!SITE_RULES) throw data(null, { status: 404 });
  return null;
}

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: `${SITE_RULES?.title ?? "قوانین"} | زروان` },
  { name: "description", content: "قوانین استفاده از سایت و خرید دوره." },
];

/*===== Page =====*/
/** The site rules, exactly as published in the registry: a heading per section, its paragraphs, and the version's date. */
export default function RulesPage() {
  // The loader has refused the request when there is nothing to show.
  const rules = SITE_RULES;
  if (!rules) return null;

  return (
    <article aria-labelledby="rules-title" className="site-container max-w-3xl py-section-sm">
      <h1 id="rules-title" className="font-display text-h1 font-black text-balance">
        {rules.title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">از تاریخ {rules.effectiveFrom}</p>

      <div className="mt-10 flex flex-col gap-10">
        {rules.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-h3 font-bold text-balance">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-pretty text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
