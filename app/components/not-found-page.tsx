import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { formatDigits } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

/*===== Dirt Specks =====*/
// A few chalk dots that hop out of the hole once on load. `--dx` is how far a speck lands from the pit (physical, in
// px, tied to the picture), `--dy` how high it climbs; the stage's `<style>` does the arc. Decorative: hidden from
// assistive tech, and not shown at all under reduced motion.
const SPECKS = [
  { dx: "-26px", dy: "34px", size: 7, delay: "0s" },
  { dx: "-10px", dy: "52px", size: 9, delay: ".08s" },
  { dx: "12px", dy: "44px", size: 6, delay: ".16s" },
  { dx: "30px", dy: "30px", size: 8, delay: ".05s" },
  { dx: "-38px", dy: "20px", size: 5, delay: ".2s" },
] as const;

/*===== Not Found Page =====*/
/**
 * What an address that doesn't exist shows, inside the public shell (no `<main>`: the shell has it). The same page
 * answers every missing URL and `/rules` while it is unpublished, so it never talks about what was looked for.
 *
 * The idea: the dog went looking for the page, dug, and found only an old bone. The big «۴۰۴» is the playful touch (it
 * is decoration; the h1 is the words).
 *
 * Wide: words at the start, the stage at the end. Phones: the stage on top (about 13rem), then the number, the h1, the
 * line and the buttons. The stage's pieces use physical sides: he faces right, his own dirt pile meets the pit at his
 * right, and the bubble's tail (a physical side) is aimed at his head, so all of it is tied to the picture.
 *
 * The one load moment (`nf-*` below): the dirt specks hop out of the pit once, the bubble pops, the digits rise in and
 * the zero wobbles. The dog's own short digging bob and the bushes loop. All off for reduced motion, which shows the
 * finished page.
 */
export function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="site-container grid items-center gap-y-4 pt-section-sm pb-2 lg:min-h-[max(32rem,calc(100svh-17rem))] lg:grid-cols-12 lg:gap-x-12"
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-6">
        {/* The page's digits (Persian or Latin), one box each so the zero can wobble by itself. */}
        <p
          aria-hidden
          className="font-display text-[6rem] leading-[0.95] font-black tracking-tight text-primary select-none lg:text-[10.5rem]"
        >
          <span className="nf-digit inline-block [--nf-delay:0s]">{formatDigits("4")}</span>
          <span className="nf-zero inline-block [--nf-delay:.1s]">{formatDigits("0")}</span>
          <span className="nf-digit inline-block [--nf-delay:.2s]">{formatDigits("4")}</span>
        </p>
        <h1 id="not-found-title" className="mt-2 font-display text-h1 leading-[1.2] font-extrabold tracking-tight">
          {m.shared_not_found_title()}
        </h1>
        <p className="mt-3 max-w-md text-lead text-pretty text-muted-foreground">{m.shared_not_found_line()}</p>

        {/*------ Ways On ------*/}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <Link to="/" className={buttonVariants({ variant: "solid", size: "lg", className: "col-span-2" })}>
            {m.shared_not_found_home()}
          </Link>
          <Link to="/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {m.shared_not_found_courses()}
          </Link>
          <Link to="/help" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {m.shared_not_found_help()}
          </Link>
        </div>
      </div>

      {/*===== Stage =====*/}
      <div className="relative order-1 h-[13.5rem] lg:order-2 lg:col-span-6 lg:h-[28rem]">
        {/* A pool of warm light where he digs, small enough to fade before the stage's edges (clipped, it shows as a box). */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_34%_48%_at_36%_76%,rgb(255_194_26/0.08),transparent)]"
        />

        {/*------ Sky ------*/}
        <NightSky className="top-0 right-0 h-16 w-[24%] lg:top-3 lg:right-[4%] lg:h-28 lg:w-[30%]" />

        {/*------ Hole, Bushes and Path ------*/}
        <div aria-hidden>
          <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
          <div className="absolute right-[2%] bottom-[0.9rem] w-[62%] translate-y-[8%] lg:right-[13%] lg:bottom-[1.2rem] lg:w-[64%]">
            <MascotCut name="hole" eager className="block w-full" />
            {/* The pit is the left third of the picture: the specks leave from its middle. */}
            <svg viewBox="0 0 40 40" className="absolute top-[34%] left-[30%] size-10 overflow-visible text-chalk">
              {SPECKS.map((speck) => (
                <circle
                  key={speck.dx}
                  cx="20"
                  cy="20"
                  r={speck.size / 2}
                  fill="currentColor"
                  className="nf-speck opacity-0"
                  style={{ "--dx": speck.dx, "--dy": speck.dy, "--nf-delay": speck.delay } as React.CSSProperties}
                />
              ))}
            </svg>
          </div>
          {/* Wide only: the dimmed signpost at the path's end, in front of the mound's far end (no room for it on a phone). */}
          <MascotCut
            name="signpost"
            className="absolute right-[-4%] bottom-[1.2rem] hidden w-[26%] translate-y-[4%] lg:block"
          />
          <MascotCut
            name="plants"
            eager
            className="lively-sway absolute bottom-[0.9rem] left-[-3%] w-[15%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[14%]"
          />
          <MascotCut
            name="plants"
            eager
            className="lively-sway-2 absolute right-[-3%] bottom-[0.9rem] w-[13%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-[11%]"
          />
        </div>

        {/*------ Dog Digging ------*/}
        {/* His bob sits on the picture itself; its origin is at his hind feet so the front end dips. */}
        <MascotCut
          name="dig"
          eager
          className="nf-dig absolute bottom-[0.9rem] left-[10%] h-[7.5rem] w-auto translate-y-[4%] lg:bottom-[1.2rem] lg:left-[8%] lg:h-[17rem]"
        />

        {/*------ Bubble ------*/}
        {/* His head is about 75% across his picture. The tail is 36px in from the bubble's left edge, so the bubble's
            left edge sits 36px before his head's middle and the tail points down at his ears. */}
        <ChalkBubble
          tail="left"
          className="nf-pop absolute bottom-[calc(0.9rem+5.1rem)] left-[calc(10%+5.4rem-36px)] max-w-[11rem] text-pretty lg:bottom-[calc(1.2rem+11.4rem)] lg:left-[calc(8%+12.3rem-36px)] lg:max-w-[17rem]"
        >
          {m.shared_not_found_bubble()}
        </ChalkBubble>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .nf-digit, .nf-zero {
            animation: nf-rise .6s cubic-bezier(.2,.8,.2,1) var(--nf-delay) both;
          }
          .nf-zero {
            transform-origin: 50% 70%;
            animation: nf-rise .6s cubic-bezier(.2,.8,.2,1) var(--nf-delay) both, nf-wobble 1s ease-in-out 1s both;
          }
          .nf-pop {
            transform-origin: 36px 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .6s both;
          }
          .nf-dig {
            transform-origin: 12% 100%;
            animation: nf-dig .9s ease-in-out infinite;
          }
          .nf-speck { animation: nf-speck 1.1s ease-out calc(.3s + var(--nf-delay)) both; }
        }
        @keyframes nf-rise {
          from { opacity: 0; transform: translateY(1.2rem); }
          to { opacity: 1; transform: none; }
        }
        @keyframes nf-wobble {
          0%, 100% { transform: none; }
          20% { transform: rotate(-14deg) scale(1.06); }
          45% { transform: rotate(10deg); }
          70% { transform: rotate(-5deg); }
          88% { transform: rotate(2deg); }
        }
        /* A short quick bob: the front end dips and comes back, like digging. */
        @keyframes nf-dig {
          0%, 100% { transform: none; }
          50% { transform: rotate(1.8deg) translateY(1.5%); }
        }
        @keyframes nf-speck {
          0% { opacity: 0; transform: translate(0, 0) scale(.5); }
          15% { opacity: .9; }
          50% { transform: translate(calc(var(--dx) * .55), calc(var(--dy) * -1)); }
          100% { opacity: 0; transform: translate(var(--dx), 0) scale(1); }
        }
      `}</style>
    </section>
  );
}
