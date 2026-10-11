import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { DoodleFrieze } from "~/routes/home/components/hero-doodles";
import { SectionHeading } from "~/routes/home/components/section-heading";

// The real order of a reservation (spec 3.3–3.6), so the numbering carries meaning.
const STEPS = [
  {
    title: "دوره و کلاس را انتخاب کن",
    body: "دوره‌ها را بر اساس حیوان، سطح و شهر ببین و از بین کلاس‌های پیش رو، زمان و مکان مناسب را پیدا کن.",
  },
  {
    title: "حیوانت را انتخاب کن",
    body: "سن و دوره‌های پیش‌نیاز حیوانت را بررسی می‌کنیم تا کلاس واقعاً برایش مناسب باشد.",
  },
  {
    title: "جایش را رزرو کن",
    body: "جای حیوانت ۱۵ دقیقه برایت نگه داشته می‌شود تا با کارت یا کیف پول پرداخت کنی. کد تخفیف هم همین‌جا وارد می‌شود.",
  },
];

// The last step forks on whether enough people booked, so it's laid out as two outcomes instead of one paragraph.
const FINAL_STEP = {
  title: "کلاس با حد نصاب شروع می‌شود",
  outcomes: [
    { lead: "اگر به حد نصاب برسد:", body: "کلاس قطعی می‌شود و پیامک می‌گیری." },
    { lead: "اگر نرسد:", body: "کل مبلغ به کیف پولت برمی‌گردد." },
  ],
};

/*===== How It Works =====*/
/**
 * The reservation flow in four numbered panels, under a frieze of the doodled people and animals the hero draws. It's
 * the page's one bronze band, the pause between shopping and meeting the trainers. The last step is the payoff,
 * so it alone is a solid gold panel and carries both outcomes.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="mt-section-md surface-inverse py-section-md">
      <div className="site-container">
        {/*------ Heading and Frieze ------*/}
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div className="min-w-0 flex-1 basis-96">
            <SectionHeading
              id="how-title"
              title="رزرو کلاس در زروان چطور است؟"
              description="چهار قدم تا جای تو در کلاس؛ و اگر کلاس برگزار نشود، پولت سر جایش برمی‌گردد."
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
            <li key={step.title} className="flex flex-col gap-2.5 rounded-3xl border bg-foreground/6 p-6">
              <StepNumber>{index + 1}</StepNumber>
              <h3 className="mt-1.5 text-h4">{step.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{step.body}</p>
            </li>
          ))}

          {/* The one solid gold panel, so it resets the band's re-pointed text colours to ink. */}
          <li className="flex flex-col gap-2.5 rounded-3xl bg-primary p-6 text-primary-foreground [--foreground:var(--primary-foreground)] [--muted-foreground:#3d2f12]">
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
/** The big count at the top of a step panel: gold on the dark panels, ink on the gold one. */
function StepNumber({ children, className }: { children: number; className?: string }) {
  return (
    <span aria-hidden className={cn("text-6xl leading-none font-black", className ?? "text-saffron")}>
      {formatNumberFa(children)}
    </span>
  );
}
