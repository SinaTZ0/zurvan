import { Bubble, Cut, HEADING } from "~/routes/new_design/components/story-parts";
import { FORMATS } from "~/routes/new_design/content";

/*===== Formats: Where we train =====*/
// Each format gets a small storybook scene of the place itself, which says more than an icon would.
const FORMAT_SCENES = ["home", "center", "lodge"] as const;
const FORMAT_DETAILS = [
  "آموزش در فضای آشنای خودت و سگت.",
  "تمرین در مرکز، با تمرکز کامل.",
  "فعلاً با یک پانسیون همکار؛ سگت آن‌جا می‌ماند و آموزش می‌بیند.",
] as const;

export function StoryFormats() {
  return (
    <section aria-labelledby="st-formats-title" className="relative bg-(--st-sage) pt-32 pb-14 md:pt-40 md:pb-16">
      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        {/*------ Behind the panel's top edge: hedges, the ears and the bubble ------*/}
        {/* The hedges' flat bottoms tuck under the edge, so they grow out from behind it like the dog does. */}
        <div aria-hidden className="absolute inset-x-4 top-0 md:inset-x-8">
          <Cut name="hedge" className="st-sway absolute right-[-2%] bottom-[calc(100%-0.6rem)] w-36 md:w-52" />
          <Cut
            name="hedge"
            className="st-sway-2 absolute bottom-[calc(100%-0.6rem)] left-[-2%] w-44 -scale-x-100 md:w-80"
          />
          <Cut
            name="ears"
            className="st-twitch absolute right-[12%] bottom-[calc(100%-0.5rem)] w-28 md:right-[22%] md:w-40"
          />
        </div>
        <div className="absolute inset-x-4 top-0 md:inset-x-8">
          <Bubble
            tail="right"
            className="st-float-2 absolute right-[calc(12%+7.5rem)] bottom-[calc(100%+1.4rem)] md:right-[calc(22%+10.5rem)] md:w-44"
          >
            جای تو یا جای ما؟
          </Bubble>
        </div>

        <div className="relative z-10 rounded-[2rem] border-2 border-(--st-line)/70 bg-(--st-sage-2) p-5 md:p-8 lg:grid lg:grid-cols-[1.25fr_3fr] lg:gap-8">
          <div className="mb-6 lg:mb-0 lg:self-center">
            <h2 id="st-formats-title" className={`${HEADING} st-reveal text-4xl md:text-5xl lg:text-[2.6rem]`}>
              کجا آموزش
              <br />
              می‌دهیم؟
            </h2>
            <p className="mt-4 max-w-xs text-lg leading-8 text-(--st-ink)/80">
              گزینه‌های انعطاف‌پذیر، متناسب با تو و سگت.
            </p>
          </div>

          <ul className="st-reveal grid gap-4 sm:grid-cols-3">
            {FORMATS.map((format, index) => (
              <li
                key={format}
                className="st-lift flex flex-col overflow-hidden rounded-2xl border border-(--st-line)/25 bg-(--st-paper-2) px-5 pt-5"
              >
                <h3 className="font-display text-lg leading-snug font-bold text-(--st-ink)">{format}</h3>
                <p className="mt-1.5 text-sm leading-6 text-(--st-ink)/75">{FORMAT_DETAILS[index]}</p>
                <Cut
                  name={FORMAT_SCENES[index]}
                  className="st-lift-pic -mx-3 mt-auto w-[calc(100%+1.5rem)] max-w-72 self-center pt-4"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
