import { data } from "react-router";

import { referralCookieFromUrl } from "~/lib/referral.server";
import { BrowseSection } from "~/routes/home/components/browse-section";
import { ClosingBanner } from "~/routes/home/components/closing-banner";
import { DealsShelf } from "~/routes/home/components/deals-shelf";
import { FeaturedCourses } from "~/routes/home/components/featured-courses";
import { HomeHero } from "~/routes/home/components/home-hero";
import { HowItWorks } from "~/routes/home/components/how-it-works";
import { TrainersSection } from "~/routes/home/components/trainers-section";
import { TrustNotes } from "~/routes/home/components/trust-notes";
import { UpcomingRuns } from "~/routes/home/components/upcoming-runs";

import type { Route } from "./+types/home";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "زروان | دوره‌های آموزش سگ و گربه با مربیان تأییدشده" },
  {
    name: "description",
    content: "کلاس‌های حضوری و آنلاین آموزش سگ و گربه با مربیان تأییدشده. جای حیوانت را رزرو کن و آنلاین پرداخت کن.",
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
      <TrustNotes />
      <BrowseSection />
      <FeaturedCourses />
      <UpcomingRuns />
      <DealsShelf />
      <HowItWorks />
      <TrainersSection />
      <ClosingBanner />
    </>
  );
}
