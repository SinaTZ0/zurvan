import { MascotCut } from "~/components/mascot-cut";
import { ChalkBubble } from "~/components/chalk-bubble";
import { BRICK } from "~/lib/brick";
import { CENTER_INSTAGRAM, CENTER_TELEGRAM, CENTER_YOUTUBE } from "~/lib/contact";
import { m } from "~/paraglide/messages";
import { COLUMN } from "~/routes/contact/column";
import { ProfileSign } from "~/routes/contact/components/profile-sign";

/*===== Profiles =====*/
// In the order the owner's card lists the messengers first: the chat, then the two channels.
const PROFILES = [CENTER_TELEGRAM, CENTER_INSTAGRAM, CENTER_YOUTUBE] as const;

/*===== Messages Wall =====*/
/**
 * The page's one brick band: the three profiles hang from the coping as signs, and the letter dog trots along the
 * coping toward the mailbox that stands at the wall's end. Both stand above the band (`bottom-full`), in the paper the
 * hero leaves for them. The wall's top padding equals the cords' length (`--cord`), so a sign hangs right under the
 * coping; on phones the signs are stacked and the same length of cord joins one to the next.
 */
export function MessagesWall() {
  return (
    <section
      aria-labelledby="messages-title"
      style={{ backgroundImage: `var(--grain), ${BRICK}` }}
      className="relative border-t-2 border-t-foreground/60 surface-inverse pt-[var(--cord)] pb-10 md:pb-14 [--cord:3rem] md:[--cord:3.5rem]"
    >
      {/*------ The Dog and the Mailbox on the Coping ------*/}
      {/* Phones: the dog at the start, the mailbox at the end. From md the two stand together at the wall's end, the dog
          a few steps from the mailbox, his bubble opening behind him (physical sides: the bubble's tail is aimed at the
          dog). The pair sits under the hero's plate, in the paper the hero leaves for it. */}
      <div aria-hidden className={`${COLUMN} pointer-events-none absolute inset-x-0 bottom-full`}>
        <div className="relative flex items-end justify-between max-md:ltr:flex-row-reverse md:justify-end md:gap-12 md:pe-[2%] md:ltr:flex-row-reverse md:ltr:justify-start md:ltr:pe-[12%]">
          <div className="relative w-28 translate-y-[2%] md:w-[6.5rem]">
            {/* The pool of light he trots through. */}
            <div className="absolute -inset-x-[60%] bottom-0 h-[120%] bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.08),transparent)]" />
            <MascotCut name="plants" className="lively-sway-2 absolute right-[70%] bottom-0 w-[64%] -scale-x-100 md:right-auto md:left-[80%] md:scale-x-100" />
            <MascotCut name="letter" className="lively-hop relative block w-full" />
            <ChalkBubble
              tail="right"
              className="absolute right-[84%] bottom-[56%] w-max max-w-[9.5rem] text-pretty md:hidden"
            >
              {m.contact_wall_bubble()}
            </ChalkBubble>
            <ChalkBubble
              tail="left"
              className="absolute bottom-[50%] left-[110%] hidden w-max max-w-[12rem] text-pretty md:block"
            >
              {m.contact_wall_bubble()}
            </ChalkBubble>
          </div>

          {/* The mailbox, bushes in its grass. */}
          <div className="relative w-24 translate-y-[3%] md:w-28">
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[70%] z-10 w-[60%]" />
            <MascotCut name="mailbox" className="relative block w-full" />
          </div>
        </div>
      </div>

      <div className={COLUMN}>
        <h2 id="messages-title" className="sr-only">
          {m.contact_wall_title()}
        </h2>
        <ul className="grid gap-[var(--cord)] md:grid-cols-3 md:gap-6">
          {PROFILES.map((profile) => (
            <ProfileSign key={profile.href} profile={profile} />
          ))}
        </ul>
      </div>

      {/* A sign swings a few degrees on its cords when its plate is hovered or focused, pivoting on the nails (the
          cords' tops, `--cord` above the plate) and settling back. Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ct-sign { transform-origin: 50% calc(var(--cord) * -1); }
          .ct-sign:has(> a:hover), .ct-sign:has(> a:focus-visible) {
            animation: ct-swing 1.1s cubic-bezier(.3,.6,.4,1);
          }
        }
        @keyframes ct-swing {
          0%, 100% { transform: none; }
          18% { transform: rotate(3deg); }
          42% { transform: rotate(-2deg); }
          64% { transform: rotate(1deg); }
          84% { transform: rotate(-.4deg); }
        }
      `}</style>
    </section>
  );
}
