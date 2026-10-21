import { Fragment } from "react";

import { formatNumberFa } from "~/lib/digits";
import type { SiteRules } from "~/lib/site-rules";

/*===== Chalk Divider =====*/
/** A faint dashed chalk line between two sections; it draws itself as it scrolls into view (`rl-draw`). */
function ChalkDivider() {
  return (
    <svg aria-hidden viewBox="0 0 600 12" preserveAspectRatio="none" className="rl-draw h-3 w-full text-foreground/20">
      <path
        d="M2 6C60 3 110 9 170 6S290 3 350 6S480 9 598 5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="14 10"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/*===== Rules Sections =====*/
/**
 * The published text, exactly as given and in order: each section is a gold numbered disc and its heading, then its
 * paragraphs at a readable measure. The ids (`rule-1`, `rule-2`...) are what the contents plate links to; the scroll
 * margin clears the sticky header. A section that is the `:target` gives its disc one hop (see `RulesArticle`).
 */
export function RulesSections({ sections }: { sections: SiteRules["sections"] }) {
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section, index) => (
        <Fragment key={index}>
          {index > 0 && <ChalkDivider />}
          <section
            id={`rule-${index + 1}`}
            aria-labelledby={`rule-${index + 1}-title`}
            className="lively-reveal scroll-mt-24"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="rl-disc grid size-10 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground"
              >
                {formatNumberFa(index + 1)}
              </span>
              <h2
                id={`rule-${index + 1}-title`}
                className="pt-1 font-display text-h3 leading-[1.4] font-extrabold tracking-tight text-balance"
              >
                {section.heading}
              </h2>
            </div>
            <div className="mt-4 flex max-w-[65ch] flex-col gap-4 sm:ps-14">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="leading-relaxed text-pretty text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </Fragment>
      ))}
    </div>
  );
}
