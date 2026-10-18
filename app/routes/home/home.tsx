import { data } from "react-router";

import { referralCookieFromUrl } from "~/lib/referral.server";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import {
  decideHeroOnLoad,
  HERO_COOKIE,
  HERO_COOKIE_MAX_AGE,
  HERO_SESSION_COOKIE,
  serializeHeroCookie,
} from "~/lib/hero-state";
import { ClosingBanner } from "~/routes/home/components/closing-banner";
import { EvaluationPanel } from "~/routes/home/components/evaluation-panel";
import { HomeHero } from "~/routes/home/components/home-hero";
import { PromiseStrip } from "~/routes/home/components/promise-strip";
import { QuickActions } from "~/routes/home/components/quick-actions";
import { ServicesSection } from "~/routes/home/components/services-section";
import { TrainerSection } from "~/routes/home/components/trainer-section";
import { HERO_SLIDES } from "~/routes/home/hero-slides";

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
// The page is copy and photos, so the server does two small things: remember a partner's referral code from `?ref=`
// (so signup can attribute the customer later, app-spec F7) and choose which hero dog to paint first. A new browser
// session steps to the next dog and writes both hero cookies; inside a session the stored dog is shown as it is
// (rules in `~/lib/hero-state`). The course list used to load here for the home grid; the courses now live on `/courses`.
export async function loader({ request }: Route.LoaderArgs) {
  const referralCookie = await referralCookieFromUrl(request.url, request.headers);
  const hero = decideHeroOnLoad({ cookieHeader: request.headers.get("Cookie"), count: HERO_SLIDES.length });

  const headers = new Headers();
  if (referralCookie) headers.append("Set-Cookie", referralCookie);
  if (hero.startsSession) {
    headers.append(
      "Set-Cookie",
      serializeHeroCookie({ name: HERO_COOKIE, value: String(hero.index), maxAge: HERO_COOKIE_MAX_AGE }),
    );
    headers.append("Set-Cookie", serializeHeroCookie({ name: HERO_SESSION_COOKIE, value: "1" }));
  }

  return data({ heroIndex: hero.index, heroStartedSession: hero.startsSession }, { headers });
}

/*===== Page =====*/
// Switched off at the owner's request but kept, with their photos, for when they come back: `NeedsSection` and
// `CourseGrid` (the home page was too full, with the courses shown twice and priced; they live on `/courses`) and
// `TeamSection` (the owner is the only trainer for now). To bring one back, import it here and render it.
export default function HomePage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <HomeHero initialIndex={loaderData.heroIndex} startedSession={loaderData.heroStartedSession} />
      <QuickActions />
      <PromiseStrip />
      <EvaluationPanel />
      <ServicesSection />
      <TrainerSection />
      <ClosingBanner />
    </>
  );
}
