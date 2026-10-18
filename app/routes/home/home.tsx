import { data } from "react-router";

import { referralCookieFromUrl } from "~/lib/referral.server";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { ClosingBanner } from "~/routes/home/components/closing-banner";
import { EvaluationPanel } from "~/routes/home/components/evaluation-panel";
import { HomeHero } from "~/routes/home/components/home-hero";
import { PromiseStrip } from "~/routes/home/components/promise-strip";
import { QuickActions } from "~/routes/home/components/quick-actions";
import { ServicesSection } from "~/routes/home/components/services-section";
import { TrainerSection } from "~/routes/home/components/trainer-section";

import type { Route } from "./+types/home";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: `آموزش K9 | آموزش خصوصی سگ با ${HEAD_TRAINER.name}` },
  {
    name: "description",
    content: `آموزش خصوصی سگ با ${HEAD_TRAINER.name}، با ${formatNumberFa(HEAD_TRAINER.years)} سال تجربه در ${CENTER_SERVICE_AREA}. آموزش پایه و پیشرفته، رفتارشناسی و اصلاح رفتار، آموزش تخصصی و آمادگی مسابقه برای تمامی نژادها و سنین. ارزیابی اول رایگان است.`,
  },
];

/*===== Loader =====*/
// The page is copy and photos, so the only thing to do on the server is remember a partner's referral code from
// `?ref=`, so signup can attribute the customer later (app-spec F7). The course list used to load here for the home
// grid; the courses now live only on `/courses`.
export async function loader({ request }: Route.LoaderArgs) {
  const referralCookie = await referralCookieFromUrl(request.url, request.headers);
  return data(null, referralCookie ? { headers: { "Set-Cookie": referralCookie } } : undefined);
}

/*===== Page =====*/
// Switched off at the owner's request but kept, with their photos, for when they come back: `NeedsSection` and
// `CourseGrid` (the home page was too full, with the courses shown twice and priced; they live on `/courses`) and
// `TeamSection` (the owner is the only trainer for now). To bring one back, import it here and render it.
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <QuickActions />
      <PromiseStrip />
      <EvaluationPanel />
      <ServicesSection />
      <TrainerSection />
      <ClosingBanner />
    </>
  );
}
