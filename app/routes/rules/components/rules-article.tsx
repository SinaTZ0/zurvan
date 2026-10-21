import { RulesAsk } from "~/routes/rules/components/rules-ask";
import { RailScene, RulesContents } from "~/routes/rules/components/rules-contents";
import { RulesHeader } from "~/routes/rules/components/rules-header";
import { RulesSections } from "~/routes/rules/components/rules-sections";
import type { SiteRules } from "~/lib/site-rules";

/*===== Rules Article =====*/
/**
 * The published rules page's body: the header, the contents plate beside the sections, and the closing card. It takes
 * the rules as a prop so the route (once `SITE_RULES` is set) and the story render the same page.
 *
 * Wide: the contents plate is the sticky 4-column rail at the start, the sections 8 columns. The plate comes first in
 * the DOM, so on phones it sits right under the header and reads before the text.
 */
export function RulesArticle({ rules }: { rules: SiteRules }) {
  return (
    <>
      <RulesHeader title={rules.title} effectiveFrom={rules.effectiveFrom} />

      {/*===== Contents and Sections =====*/}
      <div className="site-container grid gap-10 pb-section-sm lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4 lg:flex lg:flex-col">
          <div className="lg:flex-1">
            <div className="lg:sticky lg:top-24">
              <RulesContents sections={rules.sections} />
            </div>
          </div>
          <RailScene />
        </div>
        <div className="lg:col-span-8 lg:pt-6">
          <RulesSections sections={rules.sections} />
        </div>
      </div>

      {/*===== The Ask =====*/}
      <div className="site-container pt-4">
        <RulesAsk />
      </div>

      {/* Motion, all off for reduced motion (which shows the finished page):
          - load: the header's bubble pops from its tail (bottom right, 36px in) and the board settles with a small rock;
          - a section that is the `:target` (a contents link, a hash link) gives its number disc one hop, pure CSS like
            Help and Privacy: the animation starts whenever the section becomes the target, after the scroll settles;
          - the chalk dividers draw themselves as they scroll into view, where the browser can (scroll-driven). */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .rl-pop {
            transform-origin: calc(100% - 36px) 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .5s both;
          }
          .rl-board {
            transform-origin: 50% 100%;
            animation: rl-settle 1.3s ease-out .15s both;
          }
          section:target .rl-disc {
            animation: rl-hop .7s cubic-bezier(.3,.7,.4,1) .3s both;
          }
          @supports (animation-timeline: view()) {
            .rl-draw {
              animation: rl-draw linear both;
              animation-timeline: view();
              animation-range: entry 20% cover 45%;
            }
          }
        }
        @keyframes rl-settle {
          0% { transform: rotate(-1.8deg) translateY(-1.5%); }
          30% { transform: rotate(1.2deg); }
          55% { transform: rotate(-.7deg); }
          80% { transform: rotate(.3deg); }
          100% { transform: none; }
        }
        @keyframes rl-hop {
          0%, 100% { transform: none; }
          30% { transform: translateY(-30%) scale(.96, 1.06); }
          55% { transform: scale(1.06, .94); }
          75% { transform: translateY(-8%); }
        }
        @keyframes rl-draw {
          from { clip-path: inset(0 0 0 100%); }
          to { clip-path: inset(0); }
        }
      `}</style>
    </>
  );
}
