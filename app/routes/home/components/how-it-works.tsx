import { formatNumberFa } from "~/lib/digits";
import { SectionHeading } from "~/routes/home/components/section-heading";

// The real order of a reservation (spec 3.3–3.6), so the numbering carries meaning.
const STEPS = [
  {
    title: "دوره و کلاس را انتخاب کن",
    body: "دوره‌ها را بر اساس حیوان، سطح و شهر ببین و از بین کلاس‌های پیش رو، زمان و مکان مناسب را پیدا کن.",
  },
  {
    title: "حیوانت را انتخاب کن",
    body: "سن، گونه و دوره‌های پیش‌نیاز حیوانت را بررسی می‌کنیم تا کلاس واقعاً برایش مناسب باشد.",
  },
  {
    title: "جایش را رزرو کن",
    body: "جای حیوانت ۱۵ دقیقه برایت نگه داشته می‌شود تا با کارت یا کیف پول پرداخت کنی. کد تخفیف هم همین‌جا وارد می‌شود.",
  },
  {
    title: "کلاس با حد نصاب شروع می‌شود",
    body: "وقتی تعداد رزروها به حد نصاب برسد، کلاس قطعی می‌شود و پیامک می‌گیری. اگر نرسد، کل مبلغ به کیف پولت برمی‌گردد.",
  },
];

/*===== How It Works =====*/
/**
 * The reservation flow in four steps, joined by a line: across on desktop, down the start edge on phones. It's the page's
 * one deep firuzeh band, the pause between shopping and meeting the trainers.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="mt-section-md surface-inverse py-section-md">
      <div className="site-container">
        <SectionHeading id="how-title" title="رزرو کلاس در زروان چطور است؟" />

        <ol className="mt-10 grid gap-8 lg:grid-cols-4 lg:gap-gutter">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 lg:flex-col lg:gap-5">
              {/*------ Marker and Connector ------*/}
              <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border bg-inverse text-base font-extrabold text-saffron">
                {formatNumberFa(index + 1)}
              </span>
              {/* Runs from this marker to the next one: down through the gap on phones, across it on desktop. */}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute start-5.5 top-11 -bottom-8 w-px bg-border lg:start-11 lg:-end-gutter lg:top-5.5 lg:bottom-auto lg:h-px lg:w-auto"
                />
              )}

              <div className="pb-1">
                <h3 className="text-h4">{step.title}</h3>
                <p className="mt-2 max-w-prose text-sm text-pretty text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
