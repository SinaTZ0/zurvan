import { data } from "react-router";

import { referralCookieFromUrl } from "~/lib/referral.server";
import { createServerClient } from "~/orpc/server-client.server";
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
// The catalogue is render-critical, so it comes from the database here and the page renders fully on the server.
// Reviews, problems and photos are still sample data (docs/foundations-plan.md). The loader also remembers a partner's
// referral code from `?ref=`, so signup can attribute the customer later (spec 3.11).
export async function loader({ request }: Route.LoaderArgs) {
  const [courses, referralCookie] = await Promise.all([
    createServerClient(request).course.list(),
    referralCookieFromUrl(request.url),
  ]);
  return data({ courses }, referralCookie ? { headers: { "Set-Cookie": referralCookie } } : undefined);
}

/*===== Page =====*/
export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { courses } = loaderData;

  return (
    <>
      <HomeHero />
      <TrainerIntro />
      <BrowseSection courses={courses} />
      <CourseMap courses={courses} />
      <HowItWorks />
      <ClosingBanner />
    </>
  );
}
