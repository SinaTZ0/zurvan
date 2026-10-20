import { StoryClosing, StoryFooter, StoryTrainer } from "~/routes/new_design/components/story-closing";
import { StoryFormats } from "~/routes/new_design/components/story-formats";
import { StoryHeader } from "~/routes/new_design/components/story-header";
import { StoryHero } from "~/routes/new_design/components/story-hero";
import { GroundStrip } from "~/routes/new_design/components/story-parts";
import { StoryRunner } from "~/routes/new_design/components/story-runner";
import { StoryTeach } from "~/routes/new_design/components/story-teach";
import { GRAIN, LIVELY_CSS, THEME_CSS } from "~/routes/new_design/components/story-theme";
import { StoryTrail } from "~/routes/new_design/components/story-trail";

import type { Route } from "./+types/new-design";

/*===== Meta =====*/
// A preview of the next home page for the owner: not linked from anywhere and kept out of search.
export const meta: Route.MetaFunction = () => [
  { title: "طراحی جدید | آموزش K9" },
  { name: "robots", content: "noindex, nofollow" },
];

/*===== Page =====*/
/**
 * The mascot-led home page in black and gold: Fandogh lives in the layout and talks to the visitor in chalk bubbles.
 * It draws its own header and footer, so the route sits outside the storefront shell.
 */
export default function NewDesignPage() {
  return (
    <div
      style={{ backgroundImage: GRAIN }}
      className="st-root min-h-svh overflow-x-clip bg-(--st-paper) text-(--st-ink)"
    >
      <style>{THEME_CSS}</style>
      <style>{LIVELY_CSS}</style>
      <StoryHeader />
      <main>
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
      </main>
      <StoryFooter />
    </div>
  );
}
