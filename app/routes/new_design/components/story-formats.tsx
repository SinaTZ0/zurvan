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

        <div className="relative z-10 rounded-[2rem] border-2 border-(--st-line)/70 bg-(--st-sage-2) p-4 sm:p-5 md:p-8 lg:grid lg:grid-cols-[1.25fr_3fr] lg:gap-8">
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

          {/* On phones each place is a row, its scene beside the words, so the three fit on about one screen
              instead of three tall cards. */}
          <ul className="st-reveal grid gap-3 sm:grid-cols-3 sm:gap-4">
            {FORMATS.map((format, index) => (
              <li
                key={format}
                className="st-lift grid grid-cols-[1fr_8.5rem] items-center gap-x-3 overflow-hidden rounded-2xl border border-(--st-line)/25 bg-(--st-paper-2) py-4 ps-4 pe-1 sm:flex sm:flex-col sm:items-stretch sm:px-5 sm:pt-5 sm:pb-0"
              >
                <div>
                  <h3 className="font-display text-base leading-snug font-bold text-(--st-ink) sm:text-lg">{format}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-(--st-ink)/75">{FORMAT_DETAILS[index]}</p>
                </div>
                <Cut
                  name={FORMAT_SCENES[index]}
                  className="st-lift-pic w-full sm:-mx-3 sm:mt-auto sm:w-[calc(100%+1.5rem)] sm:max-w-72 sm:self-center sm:pt-4"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
