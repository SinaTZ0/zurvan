import { cn } from "cn";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { ChalkDoodle } from "~/routes/home/components/chalk-doodle";
import { SpeechBubble } from "~/routes/home/components/speech-bubble";

/*===== Steps =====*/
// The real path from a new dog to training (app-spec F3, F5, F6), told by the dog. It is a sequence, so it is numbered.
const STEPS = [
  { title: "عکس و فیلممو بفرست", detail: "چند تا عکس یا فیلم کوتاه از من، و این‌که معمولاً کی وقتت آزاده." },
  {
    title: `${HEAD_TRAINER.firstName} زنگ می‌زنه`,
    detail: "یه وقت هماهنگ می‌کنه و میاد منو ببینه. رایگان، بدون تعهد.",
  },
  { title: "دوره‌هام باز می‌شن", detail: "بعد از ارزیابی، دوره‌هایی که برام مناسبه رو می‌تونی بخری." },
  {
    title: `بقیه‌ش با ${HEAD_TRAINER.firstName}`,
    detail: "بعد از خرید باهات تماس می‌گیره و جلسه‌ها رو با هم هماهنگ می‌کنید.",
  },
];

/*===== Evaluation Panel =====*/
/**
 * The free evaluation, the page's main ask. A dog in sunglasses and a gold bandana leans out over the top of the
 * card, so the panel reads as the dog's own invitation; beside it, the four steps from request to training.
 */
export function EvaluationPanel() {
  return (
    <section id="evaluation" aria-labelledby="evaluation-title" className="site-container scroll-mt-24 pt-section-lg">
      <div className="relative grid rounded-4xl border border-border bg-card shadow-sm lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/*===== Words =====*/}
        <div className="order-2 p-6 pt-4 sm:p-10 lg:order-1 lg:p-14">
          <h2 id="evaluation-title" className="font-display text-h1 font-black text-balance">
            اول بذار {HEAD_TRAINER.firstName} منو بشناسه
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
            هر سگی یه جور یاد می‌گیره. ارزیابی رایگان یعنی {HEAD_TRAINER.firstName} منو از نزدیک می‌بینه، می‌فهمه چی
            بلدم و از کجا شروع کنیم.
          </p>

          {/*------ Steps ------*/}
          <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-display text-base font-black text-primary-foreground"
                >
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                <div>
                  <p className="font-extrabold">{step.title}</p>
                  <p className="mt-1 text-sm text-pretty text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link to="/assessment" className={cn(buttonVariants({ size: "lg" }), "mt-10")}>
            ارزیابی رایگان بگیر
          </Link>
        </div>

        {/*===== Dog =====*/}
        {/* Phones: the dog sits on the card's top edge, its head above it. Desktop: it stands at the end of the card
            and its head clears the top. The card itself doesn't clip, so the cut-out can break out of it. */}
        <div className="relative order-1 h-44 sm:h-52 lg:order-2 lg:h-auto">
          <img
            src="/photo/home/eval-dog-640.webp"
            alt="ژرمن‌شپردی با عینک آفتابی و دستمال‌گردن زرد که با دهان باز می‌خندد"
            width={640}
            height={879}
            loading="lazy"
            className="absolute bottom-0 left-1/2 w-44 -translate-x-1/2 sm:w-52 lg:end-4 lg:left-auto lg:w-[min(100%,27rem)] lg:translate-x-0"
          />
          <ChalkDoodle
            name="crown"
            className="absolute -top-16 left-1/2 w-14 -translate-x-1/2 -rotate-6 lg:-top-24 lg:w-16"
          />

          {/*------ Bubble ------*/}
          {/* Desktop: above the card's top edge, beside the dog's raised head, its tail down toward the dog. On phones
              there's no room beside the dog, so the bubble is left out and the heading speaks for it. */}
          <SpeechBubble tail="bottom-end" className="absolute -start-24 -top-14 hidden max-w-[15rem] lg:block">
            قبل از هر کاری، بیا با هم آشنا شیم!
          </SpeechBubble>
        </div>
      </div>
    </section>
  );
}
