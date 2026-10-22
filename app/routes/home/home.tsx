import { createFileRoute } from "@tanstack/react-router";

import { GroundStrip } from "~/components/ground-strip";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { StoryClosing } from "~/routes/home/components/story-closing";
import { StoryFormats } from "~/routes/home/components/story-formats";
import { StoryHero } from "~/routes/home/components/story-hero";
import { StoryRunner } from "~/routes/home/components/story-runner";
import { StoryTeach } from "~/routes/home/components/story-teach";
import { StoryTrail } from "~/routes/home/components/story-trail";
import { StoryTrainer } from "~/routes/home/components/story-trainer";

/*===== Route =====*/
export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: `آموزش K9 | آموزش سگ با ${HEAD_TRAINER.name}` },
      {
        name: "description",
        content: `آموزش سگ با ${HEAD_TRAINER.name}، با ${formatNumberFa(HEAD_TRAINER.years)} سال تجربه در ${CENTER_SERVICE_AREA}. آموزش پایه و پیشرفته، رفتارشناسی و اصلاح رفتار، آموزش تخصصی و آمادگی مسابقه برای تمامی نژادها و سنین. ارزیابی اول رایگان است.`,
      },
    ],
  }),
  // The closing scene's dog stands on the footer's top edge, so there is no gap above it.
  staticData: { flushFooter: true },
  component: HomePage,
});

/*===== Page =====*/
/**
 * The mascot-led home page: Fandogh, a cartoon Belgian Malinois, lives in the layout and talks to the visitor in
 * chalk bubbles, from the hero's bark to the closing «بریم؟». The storefront shell draws the header, footer and tab bar.
 */
function HomePage() {
  return (
    <>
      <StoryHero />
      {/* Pulled up over the hero's bottom edge, so its card stands on the path. Not on phones, where it crowds the
          card's edge under the dog's paws (the owner's call, 2026-10-20). */}
      <GroundStrip className="z-10 -mt-7 max-sm:hidden md:-mt-9" />
      <StoryTrail />
      <StoryRunner />
      <StoryTeach />
      <StoryFormats />
      <StoryTrainer />
      <StoryClosing />
    </>
  );
}
