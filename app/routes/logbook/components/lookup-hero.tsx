import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { COLUMN } from "~/routes/logbook/column";
import { LookupForm } from "~/routes/logbook/components/lookup-form";
import { RecordStage } from "~/routes/logbook/components/record-stage";

/*===== Lookup Hero =====*/
/**
 * `/logbook`: the words and the file-number plate at the start, and at the end the dog's kennel (his home, the brass
 * plate still blank) with the dog sitting in front of it, a little towards the words, a paw on the tag of his collar:
 * the number is on him, so that is where you find it.
 *
 * The bottom padding is the room the next band's peek dog needs above the coping (he takes no room of his own). The
 * stage's pieces use physical sides: the dog looks to the right, and his bubble's tail (a physical side) is aimed at
 * his head, so his centre is the one x the bubble is placed from.
 *
 * The page's load moment (`lb-*`): the plate rises in (in `lookup-form.tsx`), the dog hops once as if showing off his
 * tag, then his bubble pops from its tail. Off for reduced motion, which shows the finished stage.
 */
export function LookupHero() {
  return (
    <section aria-labelledby="logbook-title" className="pt-section-sm pb-32 sm:pb-36">
      <div className={`${COLUMN} grid gap-y-8 lg:grid-cols-12 lg:gap-x-12`}>
        {/*===== Words =====*/}
        <div className="order-2 lg:order-1 lg:col-span-6 lg:flex lg:flex-col lg:justify-center">
          <h1 id="logbook-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
            پرونده‌ی <span className="text-primary">سگ</span>
          </h1>
          <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
            شماره‌ی پرونده رو QR سگ نوشته شده. اینجا بنویسش.
          </p>
          <LookupForm />
        </div>

        {/*===== Stage =====*/}
        <RecordStage className="lg:col-span-6">
          {/*------ Bushes and Kennel ------*/}
          <MascotCut
            name="plants"
            eager
            className="lively-sway absolute bottom-(--ground) left-[-3%] w-[15%] translate-y-[6%]"
          />
          <MascotCut
            name="kennel"
            eager
            className="absolute bottom-(--ground) left-[3%] w-[44%] translate-y-[6%] lg:w-[58%]"
          />
          <MascotCut
            name="plants"
            eager
            className="lively-sway-2 absolute right-[-3%] bottom-(--ground) w-[13%] translate-y-[6%] -scale-x-100"
          />

          {/*------ Dog With His Tag ------*/}
          <div className="lb-hop absolute bottom-(--ground) left-[58%] h-(--dog-h) -translate-x-1/2 translate-y-[3%]">
            <MascotCut name="tag" eager className="lively-breathe block h-full w-auto" />
          </div>

          {/*------ Bubble ------*/}
          {/* Its tail is 2.25rem in from its right edge, so its right edge sits that far past the dog's centre. */}
          <ChalkBubble
            tail="right"
            className="lb-pop absolute right-[calc(42%-2.25rem)] bottom-[calc(var(--ground)+var(--dog-h)+0.6rem)] max-w-[12rem] text-pretty lg:max-w-[15rem]"
          >
            شماره‌ی پرونده‌م رو QR‌مه؛ تو هم پیداش می‌کنی.
          </ChalkBubble>
        </RecordStage>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .lb-hop {
            transform-origin: 50% 100%;
            animation: lb-hop .8s cubic-bezier(.3,.7,.4,1) .9s both;
          }
          .lb-pop {
            transform-origin: calc(100% - 2.25rem) 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) 1.5s both;
          }
        }
        @keyframes lb-hop {
          0%, 100% { transform: none; }
          30% { transform: translateY(-9%) scale(.97, 1.04); }
          55% { transform: scale(1.04, .95); }
          75% { transform: translateY(-3%); }
        }
      `}</style>
    </section>
  );
}
