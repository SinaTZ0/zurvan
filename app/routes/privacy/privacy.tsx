import { useLocation } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ContentsRail, RailScene } from "~/routes/privacy/components/contents-rail";
import { DataKept } from "~/routes/privacy/components/data-kept";
import { PhotoNote } from "~/routes/privacy/components/photo-note";
import { PrivacyAsk } from "~/routes/privacy/components/privacy-ask";
import { PrivacyHeader } from "~/routes/privacy/components/privacy-header";
import { TechnicalDetails } from "~/routes/privacy/components/technical-details";
import { WhoSees } from "~/routes/privacy/components/who-sees";
import { YourHands } from "~/routes/privacy/components/your-hands";

import type { Route } from "./+types/privacy";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "حریم خصوصی | آموزش K9" },
  { name: "description", content: "چی از شماره و سگت ذخیره می‌شه و کی می‌بینه." },
];

/*===== Page =====*/
// Static: no loader, nothing to fetch or write. Its sections are linked by hash (`/privacy#who-sees`), so each one has
// an id and a scroll margin that clears the sticky header. The owner found the first version too technical and full of
// things that don't concern a customer (2026-10-19): the three sections say it in plain words, and the exact technical
// facts (IP address, the cookies, the SMS log, the code limits) moved, unchanged in substance, into the collapsed
// «جزئیات فنی» at the end, so nothing the page used to disclose is gone.
export default function PrivacyPage() {
  return (
    <>
      <PrivacyHeader />

      {/*===== Contents, the List and the Photo Note =====*/}
      {/* The contents plate is sticky through this block only: the brick band that follows breaks the page's two
          columns, and the plate (with the photo note under it) stays above the door scene that closes its column, so the column ends where the list ends. In the
          DOM the note follows the list, so on phones it reads straight after it. */}
      <div className="site-container grid gap-10 pt-10 pb-section-md lg:grid-cols-12 lg:gap-x-10 lg:pt-6">
        <DataKept className="lg:col-span-8 lg:col-start-5 lg:row-start-1" />

        <div className="lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col">
          <div className="lg:flex-1">
            <div className="lg:sticky lg:top-24">
              <ContentsRail />
              <PhotoNote className="lg:mt-8" />
            </div>
          </div>
          <RailScene />
        </div>
      </div>

      {/*===== Who Sees (the Brick Band) =====*/}
      <WhoSees />

      {/*===== Yours and Technical =====*/}
      <div className="site-container space-y-10 pt-section-md">
        <YourHands />
        <TechnicalDetails />
      </div>

      {/*===== The Ask =====*/}
      <div className="site-container pt-section-sm pb-section-sm">
        <PrivacyAsk />
      </div>

      {/* When a section is the `:target` (the contents plate, the auth page's trust note or any hash link lands on it),
          the dog or the thing standing in its heading gives one hop. Pure CSS like Help's groups: the animation starts
          whenever the section becomes the target, so each jump replays it, after the scroll has settled. The hop is on
          a wrapper, so the dog's idle loop on his own picture is untouched. Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          #kept:target .pv-hop, #who-sees:target .pv-hop, #yours:target .pv-hop {
            transform-origin: 50% 100%;
            animation: pv-hop .7s cubic-bezier(.3,.7,.4,1) .3s both;
          }
          #who-sees:target .pv-plate-2 .pv-hop { animation-delay: .4s; }
          #who-sees:target .pv-plate-3 .pv-hop { animation-delay: .5s; }
          #technical:target summary > span { animation: pv-turn .6s cubic-bezier(.3,.7,.4,1) .3s both; }
        }
        @keyframes pv-hop {
          0%, 100% { transform: none; }
          30% { transform: translateY(-14%) scale(.97, 1.04); }
          55% { transform: scale(1.04, .95); }
          75% { transform: translateY(-4%); }
        }
        @keyframes pv-turn {
          0%, 100% { transform: none; }
          40% { transform: scale(1.5) rotate(90deg); }
        }
      `}</style>
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so the header and footer stay. The retry is a full page load, as on the catalogue.
export function ErrorBoundary() {
  const { pathname, search } = useLocation();

  return (
    <section aria-labelledby="privacy-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="privacy-error-title" className="font-display text-h1 font-black text-balance">
          حریم خصوصی باز نشد
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`${pathname}${search}`} reloadDocument className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </Link>
          <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
            ارزیابی رایگان بگیر
          </Link>
        </div>
      </div>
    </section>
  );
}
