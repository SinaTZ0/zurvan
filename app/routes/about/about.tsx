import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { familyMascotPose } from "~/lib/course-mascot";
import { familiesWithCourses } from "~/lib/course-families";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { createServerClient } from "~/orpc/server-client.server";
import { AboutClosing } from "~/routes/about/components/about-closing";
import { AboutFacts } from "~/routes/about/components/about-facts";
import { AboutHero } from "~/routes/about/components/about-hero";
import { AboutLineup, type LineupFamily } from "~/routes/about/components/about-lineup";

import type { Route } from "./+types/about";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: `درباره‌ی ${HEAD_TRAINER.name} | زروان` },
  {
    name: "description",
    content: `${HEAD_TRAINER.name}، ${HEAD_TRAINER.role}، با ${formatNumberFa(HEAD_TRAINER.years)} سال سابقه‌ی حرفه‌ای در ${CENTER_SERVICE_AREA}.`,
  },
];

/*===== Loader =====*/
// Public. The only data is which course families exist, for the «what I learn with her» lineup (a family with no
// course gets no dog, so no link leads to an empty catalogue). If the course list can't be read the lineup is left
// out and the rest of the page, which is all fixed facts, still renders.
export async function loader({ request }: Route.LoaderArgs): Promise<{ families: LineupFamily[] }> {
  try {
    const courses = await createServerClient(request).course.list();
    return {
      families: familiesWithCourses(courses).map(({ family, label }) => ({
        family,
        label,
        pose: familyMascotPose(family),
      })),
    };
  } catch {
    return { families: [] };
  }
}

/*===== Page =====*/
// Every fact comes from the owner's business card (`HEAD_TRAINER`, `contact.ts`); the page adds nothing to it, no
// biography and no claim about where or how training is held. The photo is one of the two the owner sent on
// 2026-10-19 (the home page shows the other); which of them is her chosen introduction is still open.
export default function AboutPage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <AboutHero />
      <AboutFacts />
      {loaderData.families.length > 0 && <AboutLineup families={loaderData.families} />}
      <AboutClosing />
    </>
  );
}
