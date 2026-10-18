import { cn } from "cn";

import { SpeechBubble } from "~/components/speech-bubble";
import { AUTH_SCENES, AUTH_STEP_NAMES, type AuthStepName, isWelcomePortrait } from "~/routes/auth/auth-scenes";

/*===== Auth Bubble =====*/
/**
 * What the step's dog says. The welcome portrait's bubble sits beside its muzzle on phones; the other dogs' bubbles
 * straddle the photo band's bottom edge with the tail up. On desktop the tail points down toward the dog's head: from
 * `xl` the bubble floats in the dark gap between the dog and the form; on a narrow laptop there is no such gap, so it sits
 * above the headline at the form column's end, as the home hero's does.
 *
 * It lives in the form column's flow, ahead of the headline, and only leaves it (absolute against the page) at `xl`.
 *
 * The outline draws itself once on load (the page's one orchestrated moment). A step change only swaps the words, with no
 * re-draw: every step's line sits in the same grid cell, so the bubble keeps the size of the longest and doesn't jump.
 */
export function AuthBubble({ step }: { step: AuthStepName }) {
  return (
    <div
      className={cn(
        "pointer-events-none z-10 -mt-20 flex justify-end lg:mt-0 lg:mb-9 xl:absolute xl:end-[47%] xl:top-[17%] xl:mb-0 xl:block",
        // Keep the same space in the form flow while lifting this bubble beside the welcome dog's face.
        isWelcomePortrait(step) &&
          "-mt-40 mb-20 justify-start lg:mt-0 lg:mb-9 lg:justify-end xl:end-[40%] xl:top-[23%] xl:mb-0",
      )}
    >
      <SpeechBubble tail="top-end" lgTail="bottom-end" drawIn className="max-w-[16rem] lg:max-w-[15rem]">
        <span className="grid">
          {AUTH_STEP_NAMES.map((name) => (
            <span
              key={name}
              aria-hidden={name !== step}
              className={cn(
                "[grid-area:1/1] motion-safe:transition-opacity motion-safe:duration-700",
                name === step ? "opacity-100 motion-safe:delay-500" : "opacity-0",
              )}
            >
              {AUTH_SCENES[name].line}
            </span>
          ))}
        </span>
      </SpeechBubble>
    </div>
  );
}
