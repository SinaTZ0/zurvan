import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { AUTH_SCENES, type AuthStepName } from "~/routes/auth/auth-scenes";

/*===== Stage Dog =====*/
/**
 * One step's dog at the door, with the bubble that asks the step's question. All four stand in the stage from the start
 * and only the active one shows: a step change is then two CSS transitions (the old one steps down and fades, the new one
 * hops up) and the new bubble's pop restarts by itself, because its animation only exists while its dog is active (see
 * the `<style>` in `AuthStage`). Without motion the same classes give the finished page: one dog, one bubble.
 *
 * Three nested layers keep the motions apart, since they all move `transform`/`translate`: the outer one is the
 * presence (translate and opacity), the middle one is the load moment (he trots on once), the picture itself carries the
 * idle loop. The bubble hangs off the middle layer, so it travels with him and floats on its own.
 *
 * Sides are physical on purpose: he faces right in every pose, towards the form, and the bubble's tail is aimed at him.
 */
export function StageDog({ name, active, eager }: { name: AuthStepName; active: boolean; eager: boolean }) {
  const scene = AUTH_SCENES[name];

  return (
    <div
      data-active={active}
      className={cn(
        "au-dog absolute bottom-[calc(0.8*var(--u))] z-10 -translate-x-1/2 lg:bottom-[calc(1.1*var(--u))]",
        "data-[active=false]:invisible data-[active=false]:translate-y-5 data-[active=false]:opacity-0",
        scene.place,
      )}
    >
      <div className="au-arrive relative">
        {/*------ Dog ------*/}
        <MascotCut
          name={scene.pose}
          eager={eager}
          className={cn("lively-pet relative block w-auto", scene.size, scene.loop)}
        />

        {/*------ Bubble ------*/}
        {/* Raised a little above his ears; its tail (36px in from its right edge) points down at his head. */}
        <ChalkBubble
          tail="right"
          className={cn(
            "au-bubble absolute bottom-[calc(100%+0.6rem)] w-max max-w-[min(13.5rem,calc(13.2*var(--u)))] text-pretty lg:max-w-[16.5rem]",
            scene.bubble,
          )}
        >
          {scene.line}
        </ChalkBubble>
      </div>
    </div>
  );
}
