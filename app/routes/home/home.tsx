import { useState } from "react";
import { data } from "react-router";

import { referralCookieFromUrl } from "~/lib/referral.server";
import type { CourseFamily } from "~/orpc/course/constants";
import { createServerClient } from "~/orpc/server-client.server";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { ClosingBanner } from "~/routes/home/components/closing-banner";
import { CourseGrid } from "~/routes/home/components/course-grid";
import { EvaluationPanel } from "~/routes/home/components/evaluation-panel";
import { HomeHero } from "~/routes/home/components/home-hero";
import { NeedsSection } from "~/routes/home/components/needs-section";
import { PromiseStrip } from "~/routes/home/components/promise-strip";
import { ServicesSection } from "~/routes/home/components/services-section";
import { TeamSection } from "~/routes/home/components/team-section";
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
// The catalogue is render-critical, so it comes from the database here and the page renders fully on the server.
// The photos are still illustrative. The loader also remembers a partner's referral code
// from `?ref=`, so signup can attribute the customer later (app-spec F7).
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
  // Shared by the needs cards, which pick a family, and the course grid, which shows it.
  const [family, setFamily] = useState<CourseFamily | "all">("all");

  return (
    <>
      <HomeHero />
      <PromiseStrip />
      <EvaluationPanel />
      <NeedsSection onPick={setFamily} />
      <CourseGrid courses={courses} family={family} onFamilyChange={setFamily} />
      <ServicesSection />
      <TrainerSection />
      <TeamSection />
      <ClosingBanner />
    </>
  );
}
