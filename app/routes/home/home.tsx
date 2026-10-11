import { data } from "react-router";

import { referralCookieFromUrl } from "~/lib/referral.server";
import { BrowseSection } from "~/routes/home/components/browse-section";
import { ClosingBanner } from "~/routes/home/components/closing-banner";
import { CourseMap } from "~/routes/home/components/course-map";
import { HomeHero } from "~/routes/home/components/home-hero";
import { HowItWorks } from "~/routes/home/components/how-it-works";
import { TrainerIntro } from "~/routes/home/components/trainer-intro";
import { HEAD_TRAINER } from "~/lib/head-trainer";

import type { Route } from "./+types/home";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: `آموزش K9 | آموزش خصوصی سگ با ${HEAD_TRAINER.name}` },
  {
    name: "description",
    content: `آموزش خصوصی سگ با ${HEAD_TRAINER.name}، در خانه‌ی خودت یا بیرون. از سگ خونگی و CGC تا سگ همدم، سگ‌های کار و ورزشی. ارزیابی اول رایگان است.`,
  },
];

/*===== Loader =====*/
// The page's content is sample data for now (docs/foundations-plan.md). The loader's one real job is remembering a
// partner's referral code from `?ref=`, so signup can attribute the customer later (spec 3.11).
export async function loader({ request }: Route.LoaderArgs) {
  const referralCookie = await referralCookieFromUrl(request.url);
  return data(null, referralCookie ? { headers: { "Set-Cookie": referralCookie } } : undefined);
}

/*===== Page =====*/
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <TrainerIntro />
      <BrowseSection />
      <CourseMap />
      <HowItWorks />
      <ClosingBanner />
    </>
  );
}
