import { useLocation } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ContentsRail } from "~/routes/privacy/components/contents-rail";
import { DataKept } from "~/routes/privacy/components/data-kept";
import { PrivacyAsk } from "~/routes/privacy/components/privacy-ask";
import { PrivacyHeader } from "~/routes/privacy/components/privacy-header";
import { SignInCode } from "~/routes/privacy/components/sign-in-code";
import { WhoSees } from "~/routes/privacy/components/who-sees";
import { YourHands } from "~/routes/privacy/components/your-hands";

import type { Route } from "./+types/privacy";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "حریم خصوصی | آموزش K9" },
  { name: "description", content: "چی از شماره و سگت ذخیره می‌شه و کی می‌بینه." },
];

/*===== Page =====*/
// Static: no loader, nothing to fetch or write. Its sections are linked by hash (`/privacy#who-sees`), so each one has
// an id and a scroll margin that clears the sticky header.
export default function PrivacyPage() {
  return (
    <>
      <PrivacyHeader />

      {/*===== Contents and Sections =====*/}
      <div className="site-container grid gap-16 pt-16 lg:grid-cols-12 lg:gap-x-10 lg:pt-20">
        <div className="lg:col-span-4">
          <ContentsRail />
        </div>

        <div className="space-y-20 lg:col-span-8">
          <DataKept />
          <WhoSees />
          <SignInCode />
          <YourHands />
        </div>
      </div>

      {/*===== The Ask =====*/}
      <div className="site-container py-section-sm">
        <PrivacyAsk />
      </div>
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so the header and footer stay. The retry is a full page load, as on the catalogue.
export function ErrorBoundary() {
  const { pathname, search } = useLocation();

  return (
    <section aria-labelledby="privacy-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="privacy-error-title" className="font-display text-h1 font-black text-balance">
          حریم خصوصی باز نشد
        </h1>
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
