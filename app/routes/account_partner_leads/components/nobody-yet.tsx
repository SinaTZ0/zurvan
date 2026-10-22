import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { m } from "~/paraglide/messages";

/*===== Nobody Yet =====*/
/**
 * A partner with no people yet, in place of the pills and rows: the center's dog lies by the old phone, waiting for the
 * first one, on a strip of path with the dimmed mailbox behind him and a bush either side. Under the stage a title says
 * it plainly. There is no button: the form beside it is the action.
 *
 * The stage's pieces use physical sides (he faces right, towards the plate's start; the bubble's tail is aimed at his
 * head). Motion: the stage rises in with the list, he breathes, the bubble pops after it.
 */
export function NobodyYet() {
  return (
    <div className="pl-row [--answer-delay:.2s]">
      {/*===== Stage =====*/}
      <div
        aria-hidden
        className="relative -mx-5 h-[13rem] [--dog-w:12.5rem] [--ground:0.9rem] sm:-mx-8 sm:h-[15rem] lg:[--dog-w:14.5rem] lg:[--ground:1.1rem]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.08),transparent)]" />
        <NightSky className="inset-x-[10%] top-2 h-16 sm:h-20" />
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-8" />

        {/*------ Pieces ------*/}
        {/* The mailbox at the far (left) end, the dog lying in front of it towards the plate's start. */}
        <div className="absolute inset-x-0 bottom-(--ground) mx-auto h-full w-[19rem] sm:w-[24rem]">
          <MascotCut
            name="plants"
            className="lively-sway absolute bottom-0 -left-[0.75rem] w-[3rem] translate-y-[6%] sm:w-[3.75rem]"
          />
          <MascotCut
            name="mailbox"
            className="absolute bottom-0 left-[1.25rem] w-[6rem] translate-y-[5%] sm:left-[2rem] sm:w-[7.5rem]"
          />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute -right-[0.75rem] bottom-0 w-[2.75rem] translate-y-[6%] -scale-x-100 sm:w-[3.5rem]"
          />

          {/*------ The Dog by the Phone ------*/}
          <div className="absolute right-[0.5rem] bottom-0 w-(--dog-w) translate-y-[4%]">
            <div className="lively-pet">
              <MascotCut name="wait-phone" className="lively-breathe block w-full" />
            </div>
          </div>

          {/* His head is about 42% of his width in from his right side, near the top of his 213/436 height: the
              tail's centre (2.25rem in from the bubble's right edge) lands over it. */}
          <ChalkBubble
            tail="right"
            className="pl-empty-pop absolute right-[calc(0.5rem+var(--dog-w)*0.42-2.25rem)] bottom-[calc(var(--dog-w)*0.47+0.5rem)] max-w-[13rem] text-pretty sm:max-w-[16rem]"
          >
            {m.account_partner_leads_nobody_bubble()}
          </ChalkBubble>
        </div>
      </div>

      {/*===== Words =====*/}
      <div className="pt-6 text-center">
        <h3 className="text-xl font-extrabold text-balance">{m.account_partner_leads_nobody_title()}</h3>
        <p className="mx-auto mt-2 max-w-md text-pretty text-muted-foreground">
          {m.account_partner_leads_nobody_body()}
        </p>
      </div>
    </div>
  );
}
