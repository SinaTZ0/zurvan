import { Link2Icon, PhoneIncomingIcon, QrCodeIcon, type LucideIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { BRICK } from "~/lib/brick";
import { isEnglish } from "~/lib/i18n";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";
import { COLUMN } from "~/routes/join_partner/column";

/*===== Ways In =====*/
// The three ways a customer reaches a partner, as app-spec F7 defines them. The Partner Dashboard and Leads pages
// (`/account/partner`) show them once the Admin has created the account; these plates describe what the partner gets.
// A function, not a constant: the words follow the page's language when it renders.
function ways(): { icon: LucideIcon; title: string; detail: string }[] {
  return [
    { icon: Link2Icon, title: m.join_partner_way_link_title(), detail: m.join_partner_way_link_detail() },
    { icon: QrCodeIcon, title: m.join_partner_way_qr_title(), detail: m.join_partner_way_qr_detail() },
    { icon: PhoneIncomingIcon, title: m.join_partner_way_number_title(), detail: m.join_partner_way_number_detail() },
  ];
}

/*===== Ways In Wall =====*/
/**
 * The page's one brick band. The heading and, at the other end, the shop counter with its card stand and the dog who
 * started from a counter like it stand on the wall's coping, in the paper above it; the three ways hang on the wall
 * as dark plates (they are not links, so they stay still and only reveal on scroll), and the note about two partners
 * entering one number sits under them.
 *
 * The scene is drawn left to right whatever the reading direction (`dir="ltr"`): his raised paw points at the counter,
 * which is a fact of the picture, and his bubble's tail is aimed at his head.
 */
export function WaysIn() {
  return (
    <section aria-labelledby="ways-title">
      {/*===== On the Coping =====*/}
      <div className={`${COLUMN} relative grid items-end gap-y-8 pt-2 lg:grid-cols-12 lg:gap-x-12`}>
        <NightSky className="inset-x-0 top-0 hidden h-3/5 lg:block" />

        {/*------ Heading ------*/}
        <div className="relative lg:col-span-6 lg:pb-12">
          <h2 id="ways-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
            {m.join_partner_ways_title()}
          </h2>
        </div>

        {/*------ Counter and Dog ------*/}
        <div aria-hidden dir="ltr" className="relative pt-24 lg:col-span-6 lg:pt-28">
          <div className="relative flex items-end justify-start lg:justify-end lg:pe-[6%]">
            {/* The dog, a bush behind him, a pool of warm light where he stands. */}
            <div className="relative z-10 w-28 translate-y-[3%] lg:w-40">
              <div className="absolute -inset-x-[40%] -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.08),transparent)]" />
              <MascotCut name="plants" className="lively-sway-2 absolute right-[84%] bottom-0 w-[52%] -scale-x-100" />
              <MascotCut name="present" className="lively-wiggle lively-pet relative block w-full" />
              {/* The wrapper pops in on scroll (`lively-reveal-pop`); the bubble inside floats. */}
              <div
                dir={isEnglish() ? "ltr" : "rtl"}
                className="lively-reveal-pop absolute bottom-[calc(100%+0.25rem)] left-[calc(50%-36px)] [transform-origin:2.25rem_100%]"
              >
                <ChalkBubble tail="left" className="lively-float-2 w-max max-w-[11rem] text-pretty lg:max-w-[14rem]">
                  {m.join_partner_ways_bubble()}
                </ChalkBubble>
              </div>
            </div>
            {/* The counter, its card stand towards him (the QR for the counter goes there), a bush at its far end. */}
            <div className="relative -ms-2 w-44 translate-y-[7%] lg:w-60">
              <MascotCut name="counter" className="relative block w-full" />
              <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[88%] z-10 w-[26%]" />
            </div>
          </div>
        </div>
      </div>

      {/*===== The Wall =====*/}
      <div
        style={{ backgroundImage: `var(--grain), ${BRICK}` }}
        className="relative border-t-2 border-b border-t-foreground/60 border-b-border surface-inverse pt-10 pb-12 lg:pt-14 lg:pb-14"
      >
        <div className={COLUMN}>
          {/*------ The Plates ------*/}
          <ul className="grid gap-5 lg:grid-cols-3 lg:gap-6">
            {ways().map(({ icon: Icon, title, detail }) => (
              <li
                key={title}
                className="jp-way flex items-start gap-4 rounded-3xl border border-border bg-jet paper-grain p-6 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.9)] lg:flex-col lg:gap-5 lg:p-8"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10">
                  <Icon aria-hidden strokeWidth={1.5} className="size-8 text-primary" />
                </span>
                <div>
                  <h3 className="font-display text-xl leading-snug font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-pretty text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ul>

          {/*------ The Note ------*/}
          <p className="jp-way mt-6 w-fit max-w-full rounded-full border border-border bg-jet paper-grain px-5 py-2.5 text-sm text-pretty text-foreground/85">
            {m.join_partner_ways_note()}
          </p>
        </div>
      </div>

      {/* The plates reveal on scroll, one a little after the other where they stand in a row (driven by the scroll
          where the browser can; elsewhere they simply show). Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @supports (animation-timeline: view()) {
            .jp-way {
              animation: lively-reveal linear both;
              animation-timeline: view();
              animation-range: entry 5% entry 75%;
            }
            .jp-way:nth-child(2) { animation-range: entry 12% entry 82%; }
            .jp-way:nth-child(3) { animation-range: entry 19% entry 89%; }
          }
        }
      `}</style>
    </section>
  );
}
