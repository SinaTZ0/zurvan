import { createFileRoute, useLocation } from "@tanstack/react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { pageHead } from "~/lib/seo";
import { m } from "~/paraglide/messages";
import { FaqGroup } from "~/routes/help/components/faq-group";
import { HelpAsk } from "~/routes/help/components/help-ask";
import { HelpHeader } from "~/routes/help/components/help-header";
import { Road } from "~/routes/help/components/road";
import { getFaqGroups, QUESTION_IDS } from "~/routes/help/faq-data";
import { useHashOpen } from "~/routes/help/hooks/use-hash-open";

/*===== Route =====*/
export const Route = createFileRoute("/_public/help")({
  head: () => pageHead({ path: "/help", title: m.help_meta_title(), description: m.help_meta_description() }),
  component: HelpPage,
  errorComponent: HelpError,
});

/*===== Page =====*/
// Static: no loader, so the whole page (every question, closed) renders on the server and works as anchors before
// hydration. The open questions live here so one hash hook can open any of them, whichever group it's in.
function HelpPage() {
  const { openIds, changeGroup } = useHashOpen({ questionIds: QUESTION_IDS });

  return (
    <>
      {/*===== Header =====*/}
      <HelpHeader />

      {/*===== The Road =====*/}
      <Road />

      {/*===== Questions =====*/}
      <div className="site-container pb-section-sm">
        {getFaqGroups().map((group) => (
          <FaqGroup key={group.id} group={group} openIds={openIds} onChange={changeGroup} />
        ))}
      </div>

      {/* When the road (or another page) leads to a group or one of its questions, that group's dog hops once, as its
          disc fills gold. Pure CSS like the disc: the animation starts whenever a group becomes the `:target`, so each
          jump replays it. The hop adds to his own translate and mirror (separate properties). Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .group\\/faq:target .help-dog, .group\\/faq:has(:target) .help-dog {
            animation: help-hop .7s cubic-bezier(.3,.7,.4,1) .25s both, lively-breathe 2.6s ease-in-out .95s infinite;
          }
        }
        @keyframes help-hop {
          0%, 100% { transform: none; }
          30% { transform: translateY(-14%) scale(.97, 1.04); }
          55% { transform: scale(1.04, .95); }
          75% { transform: translateY(-4%); }
        }
      `}</style>

      {/*===== The Ask =====*/}
      <div className="site-container pb-section-sm">
        <HelpAsk />
      </div>
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so a failure still has the header and footer. The retry is a full page load.
function HelpError() {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section aria-labelledby="help-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="help-error-title" className="font-display text-h1 font-black text-balance">
          {m.help_error_title()}
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">{m.help_error_text()}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={href} className={buttonVariants({ variant: "solid", size: "lg" })}>
            {m.help_error_retry()}
          </a>
          <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {m.help_link_evaluation()}
          </Link>
        </div>
      </div>
    </section>
  );
}
