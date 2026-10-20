import { CalendarCheck, ChevronLeft, ClipboardList, PawPrint, Phone } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatNumberFa } from "~/lib/digits";
import { Bubble, Cut, HEADING, Ticks } from "~/routes/design_lab/components/story/story-parts";
import { LAB_FORMATS, LAB_SERVICES, LAB_STEPS } from "~/routes/design_lab/lab-content";

/*===== Path: How it starts =====*/
const STEP_ICONS = [ClipboardList, Phone, CalendarCheck, PawPrint] as const;
const STEP_DETAILS = [
  "سگت را معرفی کن؛ عکس و فیلم کوتاه اختیاری است.",
  `${HEAD_TRAINER.firstName} وقت هماهنگ می‌کند و سگت را از نزدیک می‌بیند. رایگان و بدون تعهد.`,
  "بعد از ارزیابی، دوره‌هایی که به درد سگت می‌خورد باز می‌شود.",
  "بعد از خرید، جلسه‌ها را با هم هماهنگ می‌کنید.",
] as const;

export function StoryPath() {
  return (
    <section aria-labelledby="st-path-title" className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:px-8 lg:pt-20">
      <h2 id="st-path-title" className={`${HEADING} text-center text-3xl md:text-5xl`}>
        از کجا شروع می‌شود؟
      </h2>

      {/* Row gap leaves room for the dog peeking over card 3 when the cards wrap to two columns or one. */}
      <ol className="mt-16 grid gap-x-3 gap-y-8 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-x-10">
        {LAB_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index];
          return (
            // Card 3 sits lower in the wide row, as if the dog's weight pressed it down; the others keep the top line.
            <li key={step.title} className={`relative ${index === 2 ? "mt-20 lg:mt-12" : ""}`}>
              <div className="relative z-0 flex h-full flex-col items-center rounded-2xl border border-(--st-line)/25 bg-(--st-paper-2) px-5 pt-6 pb-7 text-center">
                <span className="absolute start-4 top-4 grid size-8 place-items-center rounded-full bg-(--st-badge) text-xs font-bold text-(--st-badge-ink)">
                  {formatNumberFa(index + 1)}
                </span>
                <Icon aria-hidden className="mt-2 size-8 text-(--st-sage-deep)" strokeWidth={1.6} />
                <h3 className="mt-4 font-display text-xl leading-snug font-bold text-(--st-ink)">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-(--st-ink)/75">{STEP_DETAILS[index]}</p>
              </div>

              {/*------ Connector between cards (wide layout only) ------*/}
              {index < LAB_STEPS.length - 1 && (
                <ChevronLeft
                  aria-hidden
                  className="absolute top-1/2 -left-[1.875rem] hidden size-5 -translate-y-1/2 text-(--st-ink)/60 lg:block"
                />
              )}

              {/*------ Peek: head and paws over card 3's top edge; the paws sit in front of the border ------*/}
              {index === 2 && (
                <>
                  <div className="absolute bottom-[calc(100%-1.4rem)] left-1/2 z-10 w-32 -translate-x-1/2 sm:w-36">
                    <Cut name="peek" className="w-full" />
                    <Ticks className="absolute top-[12%] -right-7 w-6" />
                    <Ticks className="absolute top-[12%] -left-7 w-6 -scale-x-100" />
                  </div>
                  <Bubble
                    tail="left"
                    className="absolute bottom-[calc(100%+3rem)] left-[calc(50%+3.4rem)] z-10 hidden w-32 text-sm sm:block lg:left-[calc(50%+6rem)]"
                  >
                    قفل‌ها دارن باز می‌شن!
                  </Bubble>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/*===== Services: What we teach =====*/
export function StoryServices() {
  return (
    <section aria-labelledby="st-services-title" className="mx-auto max-w-6xl px-4 md:px-8">
      <div className="grid gap-x-10 lg:grid-cols-[5fr_7fr]">
        {/*------ Title ------*/}
        <div className="pb-8 lg:pt-6">
          <h2 id="st-services-title" className={`${HEADING} text-4xl md:text-5xl`}>
            چه چیزی
            <br />
            یاد می‌دهیم؟
          </h2>
          <p className="mt-5 max-w-xs text-lg leading-8 text-(--st-ink)/80">
            مهارت‌های کاربردی، سگی آرام‌تر و شادتر، و رابطه‌ای محکم‌تر. برای همه‌ی نژادها و سنین.
          </p>
        </div>

        {/*------ List: plain rows, no badges ------*/}
        <ul className="order-2 divide-y divide-(--st-line)/20 border-y border-(--st-line)/20 lg:order-none lg:row-span-2 lg:self-start">
          {LAB_SERVICES.map((service) => (
            <li key={service.title} className="grid gap-1 py-4 md:grid-cols-[1.1fr_1fr] md:items-baseline md:gap-6">
              <h3 className="font-display text-lg font-bold text-(--st-ink)">{service.title}</h3>
              <p className="text-sm leading-6 text-(--st-ink)/75">{service.detail}</p>
            </li>
          ))}
        </ul>

        {/*------ Sniffing dog standing on the section's bottom edge ------*/}
        <div className="relative order-3 mt-14 min-h-[13rem] self-end lg:order-none lg:mt-0">
          <Cut name="plants" className="absolute right-[2%] bottom-0 w-32 sm:w-44" />
          <Cut name="plants" className="absolute bottom-0 left-[4%] w-28 -scale-x-100 sm:w-36" />
          <Cut name="ground" className="absolute -bottom-3 left-1/2 w-72 -translate-x-1/2 sm:w-96" />
          <Cut name="sniff" className="relative mx-auto mb-5 w-64 -scale-x-100 sm:w-80 lg:w-[25rem]" />
          <Bubble tail="left" className="absolute top-0 right-2 w-44 sm:w-52 lg:right-6">
            بو می‌کشم... یه چیز خوب پیدا کردم!
          </Bubble>
        </div>
      </div>
    </section>
  );
}

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
          <Cut name="hedge" className="absolute right-[-2%] bottom-[calc(100%-0.6rem)] w-36 md:w-52" />
          <Cut name="hedge" className="absolute bottom-[calc(100%-0.6rem)] left-[-2%] w-44 -scale-x-100 md:w-80" />
          <Cut name="ears" className="absolute right-[12%] bottom-[calc(100%-0.5rem)] w-28 md:right-[22%] md:w-40" />
        </div>
        <div className="absolute inset-x-4 top-0 md:inset-x-8">
          <Bubble
            tail="right"
            className="absolute right-[calc(12%+7.5rem)] bottom-[calc(100%+1.4rem)] md:right-[calc(22%+10.5rem)] md:w-44"
          >
            جای تو یا جای ما؟
          </Bubble>
        </div>

        <div className="relative z-10 rounded-[2rem] border-2 border-(--st-line)/70 bg-(--st-sage-2) p-5 md:p-8 lg:grid lg:grid-cols-[1.25fr_3fr] lg:gap-8">
          <div className="mb-6 lg:mb-0 lg:self-center">
            <h2 id="st-formats-title" className={`${HEADING} text-4xl md:text-5xl lg:text-[2.6rem]`}>
              کجا آموزش
              <br />
              می‌دهیم؟
            </h2>
            <p className="mt-4 max-w-xs text-lg leading-8 text-(--st-ink)/80">
              گزینه‌های انعطاف‌پذیر، متناسب با تو و سگت.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-3">
            {LAB_FORMATS.map((format, index) => (
              <li
                key={format}
                className="flex flex-col overflow-hidden rounded-2xl border border-(--st-line)/25 bg-(--st-paper-2) px-5 pt-5"
              >
                <h3 className="font-display text-lg leading-snug font-bold text-(--st-ink)">{format}</h3>
                <p className="mt-1.5 text-sm leading-6 text-(--st-ink)/75">{FORMAT_DETAILS[index]}</p>
                <Cut
                  name={FORMAT_SCENES[index]}
                  className="-mx-3 mt-auto w-[calc(100%+1.5rem)] max-w-72 self-center pt-4"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
