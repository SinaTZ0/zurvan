import { LockKeyholeIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { COLUMN } from "~/routes/logbook/column";
import { RecordStage } from "~/routes/logbook/components/record-stage";

/*===== Private Record =====*/
/**
 * What a stranger sees at a dog's record: that it is private, and nothing else. The same words and the same picture for
 * a record that is private, one that doesn't exist and a number that isn't one, so the page can't be used to find out
 * which numbers are real (nothing here is derived from the number except the sign-in link). The owner's way in is
 * signing in; the Admin's is the same. `signInRedirectTo` is where the sign-in page returns to (this record), or null
 * when there is no sign-in link to show.
 *
 * Words at the start, with a small gold lock disc beside the h1; at the end a padlocked garden gate in its hedge and
 * the dog sitting in front of it hugging the closed folder. The gate is mirrored so its padlock is on the side away
 * from the dog (he would stand on it otherwise). The bottom padding is the room the next band's peek dog needs.
 *
 * The page's load moment (`lb-*`): the gate rattles once on its latch and the lock disc shakes with it, then the dog's
 * bubble pops from its tail. Off for reduced motion, which shows the finished stage.
 */
export function PrivateRecord({ signInRedirectTo }: { signInRedirectTo: string | null }) {
  return (
    <section aria-labelledby="logbook-title" className="pt-section-sm pb-32 sm:pb-36">
      <div className={`${COLUMN} grid gap-y-8 lg:grid-cols-12 lg:gap-x-12`}>
        {/*===== Words =====*/}
        <div className="order-2 lg:order-1 lg:col-span-6 lg:flex lg:flex-col lg:justify-center">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="lb-lock flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_22px_-8px_rgb(255_194_26/0.5)] md:size-14"
            >
              <LockKeyholeIcon strokeWidth={2} className="size-6 md:size-7" />
            </span>
            <h1 id="logbook-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
              این پرونده خصوصیه
            </h1>
          </div>
          <p className="mt-5 max-w-xl text-lead text-pretty text-muted-foreground">
            چیزی از پرونده‌ی یه سگ بدون اجازه‌ی صاحبش نشون داده نمی‌شه.
          </p>
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">
            اگه صاحب سگی، وارد شو تا پرونده‌ی خودت رو ببینی.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {signInRedirectTo && (
              <Link
                to="/auth"
                search={{ redirectTo: signInRedirectTo }}
                className={buttonVariants({ variant: "solid", size: "lg", className: "sm:px-10" })}
              >
                ورود
              </Link>
            )}
            <Link
              to="/logbook/{-$fileNumber}"
              params={{ fileNumber: undefined }}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              یه شماره‌ی دیگه بنویس
            </Link>
          </div>
        </div>

        {/*===== Stage =====*/}
        <RecordStage className="lg:col-span-6">
          {/*------ Bushes and Gate ------*/}
          <MascotCut
            name="plants"
            eager
            className="lively-sway absolute bottom-(--ground) left-[-3%] w-[15%] translate-y-[6%]"
          />
          <div className="lb-rattle absolute bottom-(--ground) left-[3%] w-[48%] translate-y-[6%] lg:w-[62%]">
            <MascotCut name="gate" eager className="block w-full -scale-x-100" />
          </div>
          <MascotCut
            name="plants"
            eager
            className="lively-sway-2 absolute right-[-3%] bottom-(--ground) w-[13%] translate-y-[6%] -scale-x-100"
          />

          {/*------ Dog With the Folder ------*/}
          <div className="absolute bottom-(--ground) left-[60%] h-(--dog-h) -translate-x-1/2 translate-y-[3%]">
            <MascotCut name="folder" eager className="lively-tilt block h-full w-auto" />
          </div>

          {/*------ Bubble ------*/}
          <ChalkBubble
            tail="right"
            className="lb-pop absolute right-[calc(40%-2.25rem)] bottom-[calc(var(--ground)+var(--dog-h)+0.6rem)] max-w-[12rem] text-pretty lg:max-w-[15rem]"
          >
            ببخشید! این پرونده رو فقط صاحبش می‌بینه.
          </ChalkBubble>
        </RecordStage>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .lb-rattle { transform-origin: 50% 100%; animation: lb-rattle 1s ease-in-out .6s both; }
          .lb-lock { animation: lb-lock .9s ease-in-out .7s both; }
          .lb-pop {
            transform-origin: calc(100% - 2.25rem) 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) 1.8s both;
          }
        }
        @keyframes lb-rattle {
          0%, 100% { transform: none; }
          15% { transform: rotate(-1.8deg) translateY(-1%); }
          35% { transform: rotate(1.4deg); }
          55% { transform: rotate(-.9deg); }
          75% { transform: rotate(.4deg); }
        }
        @keyframes lb-lock {
          0%, 100% { transform: none; }
          20% { transform: rotate(-14deg); }
          40% { transform: rotate(11deg); }
          60% { transform: rotate(-7deg); }
          80% { transform: rotate(3deg); }
        }
      `}</style>
    </section>
  );
}
