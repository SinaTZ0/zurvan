import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { m } from "~/paraglide/messages";

/*===== Verdict Stage =====*/
/**
 * The scene beside (on phones, above) the verdict, one per answer. The dog checks the certificate for you:
 *
 * - **valid:** the easel with its framed certificate, the dog in front of it with his magnifying glass, pleased.
 * - **revoked:** the same easel, greyed, and the dog sitting sorry in front of it.
 * - **unknown:** he has sniffed his way along the path to a hole with only an old bone in it.
 *
 * Every Batch 3 dog faces right (the picture's own geometry), so the scenery stands to his right, which is towards the
 * words in RTL: he looks at the thing he is talking about. All positions are therefore physical (`left`/`right`), as are
 * the bubble's, whose tail is a physical side aimed at his head: its tail is 36px in from its right edge, so its right
 * edge sits 36px past the dog's head and the bubble opens to the left, over the empty sky.
 *
 * The stage is `min-h` tall on wide screens and stretches to the words' height in the valid state (the tallest), so the
 * pieces are anchored to the bottom (the ground strip) and extra height only adds sky. Motion: the load moment per
 * state (`cv-*` styles in `CertificateHero`), idle loops on every dog and bush.
 */
export function VerdictStage({ kind }: { kind: "valid" | "revoked" | "unknown" }) {
  return (
    <div className="relative order-1 h-[13.5rem] lg:order-2 lg:col-span-5 lg:h-auto lg:min-h-[23rem]">
      {/*===== Light and Sky =====*/}
      {/* A pool of warm light where he stands. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_34%_78%,rgb(255_194_26/0.08),transparent)]"
      />
      <NightSky className="top-1 left-[3%] h-20 w-[38%] lg:top-3 lg:left-[4%] lg:h-32 lg:w-[34%]" />

      {/*===== Ground and Bushes =====*/}
      <div aria-hidden>
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
        <MascotCut
          name="plants"
          className="lively-sway absolute bottom-[0.9rem] left-[-3%] w-[17%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[14%]"
        />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute right-[-3%] bottom-[0.9rem] w-[14%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-[12%]"
        />
      </div>

      {kind === "valid" && <ValidScene />}
      {kind === "revoked" && <RevokedScene />}
      {kind === "unknown" && <UnknownScene />}
    </div>
  );
}

/*===== Valid =====*/
function ValidScene() {
  return (
    <>
      <div
        aria-hidden
        className="absolute right-[4%] bottom-[0.9rem] w-[42%] translate-y-[3%] lg:bottom-[1.2rem] lg:w-[66%]"
      >
        <MascotCut name="easel" eager className="block w-full" />
      </div>
      <MascotCut
        name="magnify"
        eager
        className="lively-breathe absolute bottom-[0.9rem] left-[38%] h-[6.6rem] w-auto -translate-x-1/2 lg:bottom-[1.2rem] lg:left-[27%] lg:h-[19rem]"
      />
      <ChalkBubble
        tail="right"
        className="cv-pop absolute right-[calc(62%-36px)] bottom-[calc(0.9rem+6.6rem+0.5rem)] max-w-[10rem] text-pretty lg:right-[calc(73%-36px)] lg:bottom-[calc(1.2rem+19rem+0.9rem)] lg:max-w-[13rem]"
      >
        {m.certificate_stage_valid_bubble()}
      </ChalkBubble>
    </>
  );
}

/*===== Revoked =====*/
function RevokedScene() {
  return (
    <>
      <div
        aria-hidden
        className="absolute right-[4%] bottom-[0.9rem] w-[42%] translate-y-[3%] lg:bottom-[1.2rem] lg:w-[66%]"
      >
        {/* Greyed, as a thing that no longer counts. */}
        <div className="grayscale-[0.7]">
          <MascotCut name="easel" eager className="block w-full" />
        </div>
      </div>
      <div className="cv-settle absolute bottom-[0.9rem] left-[38%] h-[6.2rem] w-auto -translate-x-1/2 lg:bottom-[1.2rem] lg:left-[27%] lg:h-[17rem]">
        <MascotCut name="sorry" eager className="lively-breathe block h-full w-auto" />
      </div>
      <ChalkBubble
        tail="right"
        className="cv-pop absolute right-[calc(62%-36px)] bottom-[calc(0.9rem+6.2rem+0.5rem)] max-w-[10rem] text-pretty lg:right-[calc(73%-36px)] lg:bottom-[calc(1.2rem+17rem+0.9rem)] lg:max-w-[13rem]"
      >
        {m.certificate_stage_revoked_bubble()}
      </ChalkBubble>
    </>
  );
}

/*===== Unknown =====*/
// He walks in a short way along the path from the left (he faces right, so he never walks backwards), with a small bob
// per step, then the idle loop takes over; the bubble pops when he arrives.
function UnknownScene() {
  return (
    <>
      <div
        aria-hidden
        className="absolute right-[0%] bottom-[0.9rem] w-[60%] translate-y-[3%] lg:bottom-[1.2rem] lg:w-[68%]"
      >
        <MascotCut name="hole" eager className="block w-full" />
      </div>
      <div className="cv-walk absolute bottom-[0.9rem] left-[1%] w-[44%] lg:bottom-[1.2rem] lg:left-[2%] lg:w-[52%]">
        <div className="cv-bob">
          <MascotCut name="sniff" eager className="lively-breathe block w-full" />
        </div>
      </div>
      <ChalkBubble
        tail="right"
        className="cv-pop absolute right-[calc(62%-36px)] bottom-[calc(0.9rem+7rem+0.5rem)] max-w-[10rem] text-pretty lg:right-[calc(54%-36px)] lg:bottom-[calc(1.2rem+10rem+0.6rem)] lg:max-w-[13rem]"
      >
        {m.certificate_stage_unknown_bubble()}
      </ChalkBubble>
    </>
  );
}
