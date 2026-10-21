import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Privacy Header =====*/
/**
 * The page's top: the headline and one line on what the page covers, with the dog on guard beside the locked chest,
 * as if the page's contents were inside it and the bubble told you the key is the text below.
 *
 * Wide: words at the start, the stage at the end. Phones: the stage on top, the words under.
 *
 * The stage's pieces use physical sides: the dog looks straight out and the bubble's tail (a physical side) is aimed
 * at his head, so both are tied to the picture and not to the reading direction. The chest stands towards the words
 * (the page's right) so the padlock faces the headline.
 *
 * The page's one load moment (`pv-*` below): the bubble pops from its tail, then the chest gives one small shake as if
 * the padlock swung. Off for reduced motion, which shows the finished stage.
 */
export function PrivacyHeader() {
  return (
    <section
      aria-labelledby="privacy-title"
      className="site-container grid items-center gap-y-6 pt-section-sm lg:grid-cols-12 lg:gap-x-12"
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-7">
        <h1 id="privacy-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
          <span className="inline-block">از من و تو</span> <span className="inline-block">چی نگه می‌دارن؟</span>
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          اینجا ساده نوشتیم چی ذخیره می‌شه، کی می‌بینه و چی رو خودت می‌تونی عوض کنی.
        </p>
      </div>

      {/*===== Stage =====*/}
      <div className="relative order-1 h-[15.5rem] lg:order-2 lg:col-span-5 lg:h-[24rem]">
        {/* A pool of warm light where he stands. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_36%_72%,rgb(255_194_26/0.08),transparent)]"
        />

        {/*------ Sky ------*/}
        <NightSky className="top-1 right-[4%] h-24 w-[40%] lg:top-3 lg:h-32 lg:w-[38%]" />

        {/*------ Chest, Bushes and Path ------*/}
        <div aria-hidden>
          <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
          <MascotCut
            name="plants"
            eager
            className="lively-sway absolute bottom-[0.9rem] left-[-2%] w-[18%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[17%]"
          />
          <div className="pv-chest absolute right-[2%] bottom-[0.9rem] w-[50%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[54%]">
            <MascotCut name="chest" eager className="block w-full" />
          </div>
          <MascotCut
            name="plants"
            eager
            className="lively-sway-2 absolute right-[-3%] bottom-[0.9rem] w-[15%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-[14%]"
          />
        </div>

        {/*------ Dog on Guard ------*/}
        <MascotCut
          name="guard"
          eager
          className="lively-breathe absolute bottom-[0.9rem] left-[26%] h-[8.25rem] w-auto -translate-x-1/2 lg:bottom-[1.2rem] lg:left-[24%] lg:h-[16rem]"
        />

        {/*------ Bubble ------*/}
        {/* Its tail is 36px in from its left edge, so its left edge sits 36px before the dog's centre and the tail
            points down at his head. */}
        <ChalkBubble
          tail="left"
          className="pv-pop absolute bottom-[calc(0.9rem+8.25rem+0.5rem)] left-[calc(26%-36px)] max-w-[11.5rem] text-pretty lg:bottom-[calc(1.2rem+16rem+0.9rem)] lg:left-[calc(24%-36px)] lg:max-w-[14rem]"
        >
          ببین چی رو نگه می‌دارن؛ همه‌ش اینجا نوشته.
        </ChalkBubble>
      </div>

      {/* Load moment: the bubble pops from its tail (bottom left, 36px in), then the chest shakes once on its feet. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .pv-pop {
            transform-origin: 36px 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .5s both;
          }
          .pv-chest { transform-origin: 50% 100%; animation: pv-lock 1s ease-in-out 1.1s both; }
        }
        @keyframes pv-lock {
          0%, 100% { transform: none; }
          15% { transform: rotate(-1.6deg) translateY(-1%); }
          35% { transform: rotate(1.3deg); }
          55% { transform: rotate(-.8deg); }
          75% { transform: rotate(.4deg); }
        }
      `}</style>
    </section>
  );
}
