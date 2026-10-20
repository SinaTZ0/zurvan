import { ChalkBubble } from "~/components/chalk-bubble";
import { ChalkTicks } from "~/components/chalk-ticks";
import { EvaluationButton } from "~/components/evaluation-button";
import { MascotCut } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Closing =====*/
// The leash image is cut flat at the chest (84% down); that cut sits on the band's bottom edge, so the leash itself
// dangles 16% of the image into the footer.
export function StoryClosing() {
  return (
    <section
      aria-labelledby="st-closing-title"
      // `surface-inverse` re-points the page's paper to the band's grey, so the bubble reads as cut from the band.
      className="relative z-10 surface-inverse"
    >
      <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 pt-12 md:px-8 md:pt-16">
        <div className="pb-[17rem] md:min-h-[27rem] md:pe-[18rem] md:pb-16">
          <h2 id="st-closing-title" className={`${DISPLAY_HEADING} lively-reveal text-4xl md:text-6xl`}>
            حالا نوبت
            <br />
            سگ توئه!
          </h2>
          <EvaluationButton className="mt-7" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-7 z-20 w-44 md:left-[8%] md:w-64">
        <div className="relative translate-y-[16%]">
          <MascotCut name="plants" className="lively-sway absolute bottom-[16%] left-[92%] z-0 w-24 md:w-36" />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[88%] bottom-[16%] z-0 w-24 -scale-x-100 md:w-32"
          />
          <MascotCut name="leash" className="lively-hop relative z-10 w-full" />
          <ChalkTicks className="lively-ticks absolute top-[14%] -right-6 z-20 w-7 md:-right-8 md:w-8" />
          <ChalkTicks className="lively-ticks absolute top-[22%] -left-5 z-20 w-6 -scale-x-100 [animation-delay:-.7s] md:-left-7 md:w-7" />
          <ChalkBubble tail="right" className="lively-float absolute -top-6 right-[60%] z-20 md:-top-4">
            بریم؟
          </ChalkBubble>
        </div>
      </div>
    </section>
  );
}
