import { useLocation } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { FaqGroup } from "~/routes/help/components/faq-group";
import { HelpAsk } from "~/routes/help/components/help-ask";
import { HelpHeader } from "~/routes/help/components/help-header";
import { Road } from "~/routes/help/components/road";
import { FAQ_GROUPS, QUESTION_IDS } from "~/routes/help/faq-data";
import { useHashOpen } from "~/routes/help/hooks/use-hash-open";

import type { Route } from "./+types/help";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "سؤال‌های پرتکرار | آموزش K9" },
  { name: "description", content: "همه‌ی چیزهایی که برای خرید دوره، ارزیابی رایگان و ورود لازم داری." },
];

/*===== Page =====*/
// Static: no loader, so the whole page (every question, closed) renders on the server and works as anchors before
// hydration. The open questions live here so one hash hook can open any of them, whichever group it's in.
export default function HelpPage() {
  const { openIds, changeGroup } = useHashOpen({ questionIds: QUESTION_IDS });

  return (
    <>
      {/*===== Header =====*/}
      <HelpHeader />

      {/*===== The Road =====*/}
      <Road />

      {/*===== Questions =====*/}
      <div className="site-container pb-section-sm">
        {FAQ_GROUPS.map((group) => (
          <FaqGroup key={group.id} group={group} openIds={openIds} onChange={changeGroup} />
        ))}
      </div>

      {/*===== The Ask =====*/}
      <div className="site-container pb-section-sm">
        <HelpAsk />
      </div>
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so a failure still has the header and footer. The retry is a full page load.
export function ErrorBoundary() {
  const { pathname, search } = useLocation();

  return (
    <section aria-labelledby="help-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="help-error-title" className="font-display text-h1 font-black text-balance">
          راهنما باز نشد
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">
          مشکلی پیش آمد. دوباره امتحان کن یا چند دقیقه‌ی دیگه سر بزن.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`${pathname}${search}`} reloadDocument className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </Link>
          <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
            ارزیابی رایگان بگیر
          </Link>
        </div>
      </div>
    </section>
  );
}
