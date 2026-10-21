import { createFileRoute } from "@tanstack/react-router";
import { useLocation } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";
import { createServerClient } from "~/orpc/server-client.server";
import { COLUMN } from "~/routes/join_partner/column";
import { CommissionCard } from "~/routes/join_partner/components/commission-card";
import { HowToStart } from "~/routes/join_partner/components/how-to-start";
import { PartnerAsk } from "~/routes/join_partner/components/partner-ask";
import { PartnerHero } from "~/routes/join_partner/components/partner-hero";
import { WaysIn } from "~/routes/join_partner/components/ways-in";

import type { Route } from "./+types/join-partner";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "همکاری با آموزش K9" },
  {
    name: "description",
    content: "کلینیک، آرایشگاه سگ یا پت‌شاپ داری؟ مشتری‌هات رو معرفی کن و از اولین خریدشون کمیسیون بگیر.",
  },
];

/*===== Loader =====*/
// Public. The one number on the page is the commission percent in force, which the Admin can change in the settings, so
// it is read on every visit rather than fixed in the code.
export async function loader({ request }: Route.LoaderArgs) {
  const { percent } = await createServerClient(request).setting.commissionPercent();

  return { commissionPercent: percent };
}

/*===== Partner Enquiry Page =====*/
// No form. Joining starts with a phone call (the Admin creates the partner account), so the page's only action is
// `tel:`. Nothing here writes anything.
export default function JoinPartnerPage({ loaderData }: Route.ComponentProps) {
  const { commissionPercent } = loaderData;

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
export function ErrorBoundary() {
  const { pathname } = useLocation();

  return (
    <section aria-labelledby="partner-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="partner-error-title" className="font-display text-h1 font-black text-balance">
          صفحه‌ی همکاری باز نشد
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">
          مشکلی پیش آمد. دوباره امتحان کن، یا همین حالا با مرکز تماس بگیر.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={pathname} reloadDocument className={buttonVariants({ variant: "outline", size: "lg" })}>
            دوباره امتحان کن
          </Link>
          <a href={`tel:${CENTER_PHONE.tel}`} className={buttonVariants({ variant: "solid", size: "lg" })}>
            زنگ بزن: <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
          </a>
        </div>
      </div>
    </section>
  );
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/_public/join/partner")({});
