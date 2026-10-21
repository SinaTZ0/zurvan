import { useState } from "react";

import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { AUTH_STEP_NAMES, type AuthStepName } from "~/routes/auth/auth-scenes";
import { SkyExtras } from "~/routes/auth/components/sky-extras";
import { StageDog } from "~/routes/auth/components/stage-dog";

/*===== Auth Stage =====*/
/**
 * The page's picture: a front door in its stretch of brick wall at night, the lamp lit, a path in front, and the step's
 * dog waiting on the doorstep with his question in a bubble. It replaces the old photos: each step brings a different
 * pose to the door (`AUTH_SCENES`).
 *
 * Phones: a band on top of the form (the logo is laid over its top start corner by the page). Desktop: a tall panel
 * that is the page's other half, inset 1rem from the viewport's edges and, on a big screen, capped at 48 x 56rem and
 * centred in its half: the cut-outs can't be drawn larger than they are at the cap, so a taller panel would only add
 * empty sky.
 *
 * Both are drawn on a grid of units, `--u`: the smaller of the stage's width and height shares (a phone band is 24.4 x
 * 18 units, the desktop panel 43 x 54.25), capped so the cut-outs are never drawn much past their natural size, which
 * is where they go soft. Everything inside is sized and placed in `--u`, so the scene scales whole whatever the screen
 * is, and sits on the stage's bottom edge with the sky taking the rest.
 *
 * Decoration only (`aria-hidden`): the bubble's question is the form's own heading. Pieces use physical sides on
 * purpose: the door's lamp and the dogs' faces are tied to the pictures, not to the reading direction.
 *
 * Motion (all under `prefers-reduced-motion: no-preference`; without it the finished page shows): on load the lamp
 * warms up, then the dog trots on and his bubble pops; a step change moves him out and the next one in (`StageDog`);
 * bushes sway, the dogs idle, the bubble floats, the lamp breathes, stars twinkle and clouds drift.
 */
export function AuthStage({ step, firstStep }: { step: AuthStepName; firstStep: AuthStepName }) {
  // Once the person has moved on from the first step, the bubbles pop sooner (no load sequence to wait for). Set during
  // render, so the first paint already has the right delays.
  const [hasMoved, setHasMoved] = useState(false);
  if (!hasMoved && step !== firstStep) setHasMoved(true);

  return (
    <div
      aria-hidden
      data-moved={hasMoved}
      className="au-stage [container-type:size] relative isolate h-[18rem] overflow-hidden rounded-b-4xl border-b border-foreground/10 bg-sunken paper-grain [--u:min(100cqw/24.4,100cqh/18,1.25rem)] max-lg:order-first md:h-[26rem] md:[--u:min(100cqw/24.4,100cqh/18,1.8rem)] lg:h-[calc(100svh-2rem)] lg:max-h-[56rem] lg:w-[calc(100%-2rem)] lg:max-w-[48rem] lg:self-center lg:justify-self-center lg:rounded-4xl lg:border lg:[--u:min(100cqw/43,100cqh/54.25,1rem)]"
    >
      {/*===== Sky =====*/}
      {/* Phones: the moon and stars sit right of the bubble and under the logo. Desktop: across the top, with the extras
          (halo, more stars, clouds) filling the rest of the tall sky. */}
      <NightSky className="start-[2%] top-[4.1rem] h-[3.6rem] w-[36%] md:start-[8%] md:top-[6.5rem] lg:inset-x-[5%] lg:top-[3%] lg:h-[30%] lg:w-auto" />
      <SkyExtras />

      {/*===== Ground =====*/}
      {/* One path the whole scene stands in, fading out at both ends like every path on the site. */}
      <GroundStrip className="absolute inset-x-0 bottom-0 h-[calc(2.2*var(--u))] [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] md:h-[calc(2.2*var(--u))] lg:h-[calc(6*var(--u))]" />

      {/*===== Scene =====*/}
      {/* The drawn part, centred on the stage and anchored to its bottom edge. */}
      <div className="absolute inset-x-0 bottom-0 mx-auto h-[calc(18*var(--u))] w-[calc(24.4*var(--u))] lg:h-[calc(46*var(--u))] lg:w-[calc(43*var(--u))]">
        {/*------ Light ------*/}
        {/* The pool of warm light the lamp throws on the doorstep, where the dog stands. */}
        <div className="absolute bottom-0 left-[calc(4*var(--u))] h-[calc(14*var(--u))] w-[calc(20*var(--u))] bg-[radial-gradient(ellipse_50%_60%_at_50%_90%,rgb(255_194_26/0.08),transparent)] lg:left-[calc(8*var(--u))] lg:h-[calc(34*var(--u))] lg:w-[calc(36*var(--u))]" />

        {/*------ Door ------*/}
        {/* Turned around, so the lamp is on the side away from the dogs' faces and never behind a dog. */}
        <div className="absolute bottom-[calc(1*var(--u))] left-[calc(0.2*var(--u))] w-[calc(10.8*var(--u))] translate-y-[5%] lg:bottom-[calc(1.5*var(--u))] lg:left-[calc(0.5*var(--u))] lg:w-[calc(30*var(--u))]">
          <MascotCut name="door" eager className="relative block w-full -scale-x-100" />
          {/* The lamp's glow: the picture already draws it lit, this is the light it throws. It warms up on load. */}
          <span className="au-lamp absolute top-[31%] left-[25.5%] aspect-square w-[62%] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_194_26/0.4),rgb(255_194_26/0.14)_36%,transparent_68%)]" />
        </div>

        {/*------ Bushes ------*/}
        <MascotCut
          name="plants"
          className="lively-sway absolute right-[calc(0.3*var(--u))] bottom-[calc(1*var(--u))] w-[calc(5*var(--u))] translate-y-[6%] lg:right-[calc(0.6*var(--u))] lg:bottom-[calc(1.4*var(--u))] lg:w-[calc(8.5*var(--u))]"
        />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute bottom-[calc(1*var(--u))] left-[calc(17.6*var(--u))] w-[calc(3.2*var(--u))] translate-y-[6%] -scale-x-100 lg:bottom-[calc(1.4*var(--u))] lg:left-[calc(21*var(--u))] lg:w-[calc(7*var(--u))]"
        />

        {/*------ Dogs ------*/}
        {AUTH_STEP_NAMES.map((name) => (
          <StageDog key={name} name={name} active={name === step} eager={name === firstStep} />
        ))}
      </div>

      {/* The page's one load moment: the lamp warms up (a short flicker, then it holds and breathes), the first dog trots
          on and his bubble pops from its tail, which is 2.25rem in from the bubble's right edge. A step change swaps the
          dogs with transitions (the old steps down and fades, the new hops up with a little overshoot) and the new
          bubble's animation starts the moment its dog is active, so it pops again; `data-moved` shortens its delay. The
          bubble's float is second in the list, so it takes over once the pop is done. Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .au-lamp {
            animation: au-lamp 1.2s ease-out .2s both, au-lamp-breathe 4.5s ease-in-out 1.6s infinite alternate;
          }
          .au-arrive {
            animation: au-arrive .7s cubic-bezier(.3,1.3,.5,1) .75s both;
          }
          .au-dog {
            transition: opacity .18s ease-in, translate .22s ease-in, visibility 0s linear .22s;
          }
          .au-dog[data-active="true"] {
            transition: opacity .3s ease-out .16s, translate .55s cubic-bezier(.3,1.6,.5,1) .16s, visibility 0s;
          }
          .au-dog[data-active="true"] .au-bubble {
            transform-origin: calc(100% - 2.25rem) 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) 1.35s both, lively-float 3.4s ease-in-out 1.8s infinite alternate;
          }
          .au-stage[data-moved="true"] .au-dog[data-active="true"] .au-bubble {
            animation-delay: .5s, .95s;
          }
          .au-twinkle {
            animation: au-twinkle 3.6s ease-in-out infinite alternate;
          }
          .au-drift {
            animation: au-drift 38s ease-in-out infinite alternate;
          }
          .au-drift-2 {
            animation: au-drift 46s ease-in-out -20s infinite alternate-reverse;
          }
        }
        @keyframes au-lamp {
          0% { opacity: 0; }
          18% { opacity: .55; }
          26% { opacity: .2; }
          44% { opacity: .85; }
          54% { opacity: .5; }
          100% { opacity: 1; }
        }
        @keyframes au-lamp-breathe {
          from { opacity: 1; }
          to { opacity: .78; }
        }
        @keyframes au-arrive {
          0% { opacity: 0; transform: translateY(1.25rem); }
          55% { opacity: 1; transform: translateY(-.3rem); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes au-twinkle {
          from { opacity: .25; }
          to { opacity: 1; }
        }
        @keyframes au-drift {
          from { transform: translateX(-1.5rem); }
          to { transform: translateX(1.5rem); }
        }
      `}</style>
    </div>
  );
}
