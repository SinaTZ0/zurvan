import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useLocation } from "@tanstack/react-router";

import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";
import { pageHead } from "~/lib/seo";
import { orpc } from "~/orpc/client";
import { m } from "~/paraglide/messages";
import { COLUMN } from "~/routes/join_partner/column";
import { CommissionCard } from "~/routes/join_partner/components/commission-card";
import { HowToStart } from "~/routes/join_partner/components/how-to-start";
import { PartnerAsk } from "~/routes/join_partner/components/partner-ask";
import { PartnerHero } from "~/routes/join_partner/components/partner-hero";
import { WaysIn } from "~/routes/join_partner/components/ways-in";

/*===== Route =====*/
// Public. The one number on the page is the commission percent in force, which the Admin can change in the settings, so
// it is read from the settings rather than fixed in the code.
export const Route = createFileRoute("/_public/join/partner")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(orpc.setting.commissionPercent.queryOptions()),
  head: () =>
    pageHead({
      path: "/join/partner",
      title: m.join_partner_meta_title(),
      description: m.join_partner_meta_description(),
    }),
  component: JoinPartnerPage,
  errorComponent: PartnerError,
});

/*===== Partner Enquiry Page =====*/
// No form. Joining starts with a phone call (the Admin creates the partner account), so the page's only action is
// `tel:`. Nothing here writes anything.
function JoinPartnerPage() {
  const {
    data: { percent: commissionPercent },
  } = useSuspenseQuery(orpc.setting.commissionPercent.queryOptions());

  return (
    <>
      <PartnerHero commissionPercent={commissionPercent} />
      <WaysIn />

      {/*===== Start and Commission =====*/}
      {/* Both plates carry their own headroom (the signpost and the basket dog stand on their top edges), so their top
          edges line up; `items-stretch` makes the shorter one as tall as the other. */}
      <div className={`${COLUMN} grid gap-x-12 py-section-sm lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]`}>
        <HowToStart />
        <CommissionCard commissionPercent={commissionPercent} />
      </div>

      {/*===== The Ask =====*/}
      <PartnerAsk />
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout. The retry is a full page load, and the phone number is the way in that never fails.
function PartnerError() {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section aria-labelledby="partner-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="partner-error-title" className="font-display text-h1 font-black text-balance">
          {m.join_partner_error_title()}
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">{m.join_partner_error_line()}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={href} className={buttonVariants({ variant: "outline", size: "lg" })}>
            {m.join_partner_error_retry()}
          </a>
          <a href={`tel:${CENTER_PHONE.tel}`} className={buttonVariants({ variant: "solid", size: "lg" })}>
            {m.join_partner_call()} <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
          </a>
        </div>
      </div>
    </section>
  );
}
