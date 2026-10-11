import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { DoodleFrieze } from "~/routes/home/components/hero-doodles";
import { SectionHeading } from "~/routes/home/components/section-heading";

// The real order of starting with the trainer, so the numbering carries meaning.
const STEPS = [
  {
    title: "ارزیابی رایگان رزرو کن",
    body: "یک زمان انتخاب کن و از سگت بگو: سن، نژاد و کاری که می‌خواهی تغییر کند.",
  },
  {
    title: `${HEAD_TRAINER.firstName} سگت را می‌بیند`,
    body: "در اولین دیدار رفتار سگت را می‌سنجد و دوره‌ای را که بهتر است از آن شروع کنید پیشنهاد می‌دهد.",
  },
  {
    title: "جلسه‌های خصوصی شروع می‌شود",
    body: "در خانه‌ی خودت یا بیرون، بسته به دوره. اگر بخواهی، سگت در پانسیون می‌ماند و آموزش همان‌جا پیش می‌رود.",
  },
];

// The last step is what a returning dog skips to, so it's laid out as what the record lets the owner do next.
const FINAL_STEP = {
  title: "پرونده‌ی سگت می‌ماند",
  outcomes: [
    { lead: "دوره‌ی بعدی:", body: "مستقیم رزرو می‌کنی، بدون ارزیابی دوباره." },
    { lead: "لول بعدی سگ همدم:", body: "به‌جای گذراندن دوره‌ی قبلی، می‌شود تستش را داد." },
  ],
};

/*===== How It Works =====*/
/**
 * Starting with the trainer in four numbered panels, under a frieze of the doodled people and animals the hero draws.
 * It's the page's one charcoal band. The last step is the payoff, what having a record here is worth, so it alone is a
 * gold-leaf panel.
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="glow mt-section-md surface-inverse py-section-md [--glow-alpha:0.05] [--glow-at:100%_0%] [--glow-h:75%] [--glow-w:50%]"
    >
      <div className="site-container">
        {/*------ Heading and Frieze ------*/}
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div className="min-w-0 flex-1 basis-96">
            <SectionHeading
              id="how-title"
              title={`شروع کار با ${HEAD_TRAINER.firstName} چطور است؟`}
              description="قدم اول رایگان است. سگ‌هایی که قبلاً این‌جا دوره دیده‌اند از قدم آخر شروع می‌کنند."
            />
          </div>
          {/* Laid out left to right so the procession's front is at the near edge; the far end fades out. */}
          <div
            dir="ltr"
            className="h-14 w-full max-w-lg min-w-0 flex-[0_1_32rem] overflow-hidden mask-r-from-[calc(100%-3rem)]"
          >
            <DoodleFrieze className="h-full w-auto" />
          </div>
        </div>

        {/*------ Steps ------*/}
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2.5 rounded-3xl border bg-black/20 p-6">
              <StepNumber>{index + 1}</StepNumber>
              <h3 className="mt-1.5 text-h4">{step.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{step.body}</p>
            </li>
          ))}

          {/* The one gold-leaf panel, so it resets the band's re-pointed text colours to ink. */}
          <li className="flex flex-col gap-2.5 rounded-3xl gold-leaf p-6 [--foreground:var(--primary-foreground)] [--muted-foreground:#3a2a0c]">
            <StepNumber className="text-primary-foreground">{STEPS.length + 1}</StepNumber>
            <h3 className="mt-1.5 text-h4">{FINAL_STEP.title}</h3>
            {FINAL_STEP.outcomes.map(({ lead, body }) => (
              <p key={lead} className="text-sm text-pretty text-muted-foreground">
                <strong className="font-bold text-foreground">{lead}</strong> {body}
              </p>
            ))}
          </li>
        </ol>
      </div>
    </section>
  );
}

/*===== Step Number =====*/
/** The big count at the top of a step panel: gold leaf on the dark panels, ink on the gold one. */
function StepNumber({ children, className }: { children: number; className?: string }) {
  return (
    <span aria-hidden className={cn("text-6xl leading-none font-black", className ?? "text-gold-leaf")}>
      {formatNumberFa(children)}
    </span>
  );
}
