import { PlusIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== No Dogs =====*/
/**
 * The Dashboard of an account with no dog yet: in place of the list, one large grained panel. Its stage is the empty
 * kennel (the brass name plate still blank) with the dog bed beside it, and the center's dog in front holding up an
 * empty picture frame: the place for the customer's dog's picture. The words and the one gold button sit beside it
 * (on phones, under it).
 *
 * The stage's pieces use physical sides (the dog faces right, towards the words; the bubble's tail is aimed at his
 * head). Motion: the panel rises in as it scrolls into view, the dog breathes, the bubble pops on reveal.
 */
export function NoDogs() {
  return (
    <section
      aria-labelledby="no-dogs-title"
      className="lively-reveal grid overflow-hidden rounded-4xl border border-border/60 bg-sunken paper-grain shadow-[0_24px_48px_-28px_rgb(0_0_0/0.9)] lg:grid-cols-12"
    >
      {/*===== Words =====*/}
      <div className="order-2 p-6 sm:p-8 lg:order-1 lg:col-span-6 lg:flex lg:flex-col lg:justify-center lg:p-12">
        <h2 id="no-dogs-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
          اولین سگت رو معرفی کن
        </h2>
        <p className="mt-3 max-w-md text-lead text-pretty text-muted-foreground">
          اسم و نژادش رو بنویس تا {HEAD_TRAINER.firstName} بشناسدش. بعدش می‌تونی ارزیابی رایگانش رو بخوای.
        </p>
        <Link
          to="/account/dogs/new"
          className={buttonVariants({ variant: "solid", size: "lg", className: "mt-7 w-full sm:w-fit sm:min-w-48" })}
        >
          <PlusIcon aria-hidden />
          معرفی سگ
        </Link>
      </div>

      {/*===== Stage =====*/}
      <div
        aria-hidden
        className="relative order-1 h-[15rem] [--dog-h:9.5rem] [--ground:0.9rem] sm:h-[17rem] lg:order-2 lg:col-span-6 lg:h-auto lg:min-h-[24rem] lg:[--dog-h:15rem] lg:[--ground:1.2rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_58%_at_50%_80%,rgb(255_194_26/0.08),transparent)]" />
        <NightSky className="inset-x-[8%] top-3 h-20 lg:top-8 lg:h-28" />
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />

        {/*------ Pieces ------*/}
        <div className="absolute inset-x-0 bottom-(--ground) mx-auto h-full w-[21rem] lg:w-[29rem]">
          <MascotCut
            name="plants"
            className="lively-sway absolute bottom-0 -left-[1rem] w-[3.5rem] translate-y-[6%] lg:-left-[1.5rem] lg:w-[5rem]"
          />
          <MascotCut
            name="kennel"
            className="absolute bottom-0 left-[1rem] w-[10rem] translate-y-[6%] lg:left-[1.5rem] lg:w-[15.5rem]"
          />
          <MascotCut
            name="dog-bed"
            className="absolute right-[0.25rem] bottom-0 w-[7rem] translate-y-[8%] lg:right-[0.5rem] lg:w-[10.5rem]"
          />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute -right-[1.25rem] bottom-0 w-[3rem] translate-y-[6%] -scale-x-100 lg:-right-[1.75rem] lg:w-[4.25rem]"
          />

          {/*------ The Dog With the Empty Frame ------*/}
          {/* Between the kennel and the bed. His head is 73% across the picture: the bubble's tail is aimed there. */}
          <div className="absolute bottom-0 left-[8.5rem] h-(--dog-h) translate-y-[3%] lg:left-[12.5rem]">
            <MascotCut name="frame" className="lively-breathe block h-full w-auto" />
          </div>
          <ChalkBubble
            tail="left"
            className="lively-reveal-pop absolute bottom-[calc(var(--dog-h)+0.4rem)] left-[calc(8.5rem+0.73*var(--dog-h)*281/375-2.25rem)] max-w-[12rem] text-pretty lg:left-[calc(12.5rem+0.73*var(--dog-h)*281/375-2.25rem)] lg:max-w-[15rem]"
          >
            جای رفیقم اینجا خالیه!
          </ChalkBubble>
        </div>
      </div>
    </section>
  );
}
