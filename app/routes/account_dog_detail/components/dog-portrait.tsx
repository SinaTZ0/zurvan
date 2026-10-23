import { ChalkBubble } from "~/components/chalk-bubble";
import { DogPhoto } from "~/components/dog-photo";
import { MascotCut } from "~/components/mascot-cut";
import type { DogStatus } from "~/lib/dog-status";
import type { Dog } from "~/orpc/dog/contract";
import { m } from "~/paraglide/messages";

/*===== Tape =====*/
// A strip of translucent tape with torn ends (the home page's taped print).
const TAPE =
  "absolute h-5 w-16 bg-foreground/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] md:w-20";

/*===== Dog Portrait =====*/
/**
 * The customer's dog as a real thing: its photo printed on a grained mount, taped to the wall a little crooked (the
 * engraved tag on a dark ground when it has no photo, in the same print). It is the customer's own dog, so no drawn dog
 * ever stands on it; only a bush at its foot and a pool of warm light behind it.
 *
 * The dog speaks its state from under the print: the bubble overlaps the print's bottom edge on the side of the words,
 * its tail pointing up into the photo. A rejected dog's bubble ends in «دلیلش اینه:», and the reason follows under it.
 * The bubble is keyed by its line, so when the state changes (a request withdrawn) it pops again with the new words.
 *
 * Phones: the full column width and 18rem tall. From `lg` at most 22rem wide, 4:5.
 */
export function DogPortrait({ dog, status }: { dog: Dog; status: DogStatus }) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:me-0 lg:max-w-[22rem]">
      {/* A pool of warm light behind the print. */}
      <div
        aria-hidden
        className="absolute -inset-x-[12%] -top-[6%] bottom-[-8%] bg-[radial-gradient(ellipse_50%_50%_at_50%_45%,rgb(255_194_26/0.09),transparent)]"
      />

      {/*------ Bushes at the Foot ------*/}
      {/* Wide screens only: there the portrait's column ends on the hero's path. Physical: the outer (left) corner. */}
      <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-14 hidden w-24 lg:block">
        <MascotCut name="plants" eager className="lively-sway block w-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-11 -left-2 hidden w-14 lg:block">
        <MascotCut name="plants" eager className="lively-sway-2 block w-full -scale-x-100" />
      </div>

      {/*------ Print ------*/}
      <figure className="dd-drop relative rotate-2 lg:rotate-[2.5deg]">
        <div className="rounded-sm border-2 border-foreground/80 bg-card paper-grain p-2 shadow-[0_22px_44px_-18px_rgb(0_0_0/0.95)] md:p-2.5">
          <DogPhoto
            name={dog.name}
            photo={dog.photo}
            microchipNumber={dog.microchipNumber}
            variant="full"
            priority
            className="h-72 w-full paper-grain lg:aspect-[4/5] lg:h-auto"
          />
        </div>
        {/* Tape across the two top corners. */}
        <span aria-hidden className={`${TAPE} -top-1 -right-2.5 rotate-45 md:-right-4`} />
        <span aria-hidden className={`${TAPE} -top-1 -left-2.5 -rotate-45 md:-left-4`} />
      </figure>

      {/*------ The Dog's Words ------*/}
      {/* In the flow and pulled up over the print's bottom edge, at the start (the words' side); the tail is physical,
          on the bubble's top-left, aimed up into the photo. */}
      <div className="relative z-10 -mt-7 flex flex-col items-start gap-2 ps-0 lg:-ms-6">
        <ChalkBubble
          key={status.line}
          tail="left"
          tailEdge="top"
          className="answer-pop max-w-[17rem] text-pretty [--answer-delay:0.45s] [--pop-origin:1.75rem_0] lg:max-w-[19rem]"
        >
          {status.line}
        </ChalkBubble>
        {status.rejectionReason && (
          <p className="max-w-xs rounded-2xl border border-border bg-card paper-grain px-4 py-2.5 text-sm text-pretty">
            <span className="font-bold text-muted-foreground">{m.account_dog_detail_reason()} </span>
            <bdi>{status.rejectionReason}</bdi>
          </p>
        )}
      </div>
    </div>
  );
}
