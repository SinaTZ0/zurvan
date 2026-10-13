import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { SpeechBubble } from "~/components/speech-bubble";

/*===== Trainers =====*/
// The three trainers, shown as equals. Each portrait has the trainer's own dog at the bottom left, and the dog says one
// line about its person. Arman's details come from `HEAD_TRAINER`; the other two names, focuses, years and all three
// photos are placeholders until the owner sends the real ones. They have no accounts in the app (app-spec).
const TRAINERS = [
  {
    key: "arman",
    name: HEAD_TRAINER.name,
    focus: "فرمان‌پذیری و سگ‌های کار",
    years: HEAD_TRAINER.years,
    line: `${HEAD_TRAINER.firstName} از یه نگاه می‌فهمه چمه.`,
    alt: `${HEAD_TRAINER.firstName} ایستاده و ژرمن‌شپردش کنار پایش نشسته`,
  },
  {
    key: "sara",
    name: "سارا مقدم",
    focus: "سگ خونگی و توله‌ها",
    years: 8,
    line: "سارا با حوصله یادم می‌ده؛ با یه عالمه تشویق!",
    alt: "سارا کنار در خانه زانو زده و بوردر کالی‌اش کنارش نشسته",
  },
  {
    key: "nima",
    name: "نیما کاظمی",
    focus: "سگ همدم و آرامش توی شهر",
    years: 6,
    line: "با نیما وسط شلوغی هم حواسم سر جاشه.",
    alt: "نیما شب در خیابان ایستاده و لابرادورش با قلاده کنارش نشسته",
  },
];

/*===== Team Section =====*/
/**
 * «معرفی مربیان»: three tall portraits in a row, the middle one set lower so the row reads as people standing
 * together rather than three equal cards. The name sits on the photo's dark bottom, and the trainer's dog talks from
 * the top. Phones swipe through them sideways, without the step.
 */
export function TeamSection() {
  return (
    <section id="team" aria-labelledby="team-title" className="scroll-mt-24 pt-section-lg">
      {/*------ Heading ------*/}
      <div className="site-container">
        <h2 id="team-title" className="font-display text-h1 font-black text-balance">
          با مربی‌هامون آشنا شو
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
          هر سه با یه روش کار می‌کنن: جلسه‌ی خصوصی، توی خونه یا بیرون، و اولش یه ارزیابی رایگان.
        </p>
      </div>

      {/*------ Portraits ------*/}
      {/* The bubbles stick out above the photos, so the row leaves room for them on top. */}
      <ul
        className={cn(
          "mt-6 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-site pt-16 pb-4",
          "lg:site-container lg:grid lg:grid-cols-3 lg:gap-gutter lg:overflow-visible lg:pt-20 lg:pb-12",
        )}
      >
        {TRAINERS.map((trainer, index) => (
          <li
            key={trainer.key}
            className={cn("w-[80%] shrink-0 snap-start sm:w-[20rem] lg:w-auto", index === 1 && "lg:translate-y-12")}
          >
            <TrainerCard trainer={trainer} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/*===== Trainer Card =====*/
/** The portrait with the dog's bubble breaking out of its top edge, and the trainer's name and focus on its bottom. */
function TrainerCard({ trainer }: { trainer: (typeof TRAINERS)[number] }) {
  return (
    <article className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-border">
        <img
          src={`/photo/home/team-${trainer.key}.webp`}
          alt={trainer.alt}
          width={800}
          height={1200}
          loading="lazy"
          decoding="async"
          className="aspect-[3/4] w-full object-cover"
        />
        {/* Shade only the bottom-right corner, behind the name: a full-width fade hid the dog, and the dog is the one
            talking. Right, not "start": the page is RTL-only and gradients have no logical sides. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_100%,var(--color-jet)_0%,--alpha(var(--color-jet)/70%)_30%,transparent_60%)]"
        />

        {/*------ Name ------*/}
        {/* At the bottom start, clear of the dog in the bottom-left corner. */}
        <div className="absolute start-0 bottom-0 w-4/5 p-6 lg:w-2/3">
          <h3 className="font-display text-2xl font-black">{trainer.name}</h3>
          <p className="mt-1 text-sm font-bold text-primary">{trainer.focus}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatNumberFa(trainer.years)} سال کار با سگ‌ها</p>
        </div>
      </div>

      {/*------ The Dog's Line ------*/}
      {/* Half over the photo's top edge, at the end, the tail pointing down at the dog in the bottom-left corner. */}
      <SpeechBubble tail="bottom-end" className="absolute end-4 -top-12 max-w-[17rem]">
        {trainer.line}
      </SpeechBubble>
    </article>
  );
}
