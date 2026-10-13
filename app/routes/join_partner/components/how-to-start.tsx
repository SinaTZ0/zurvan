import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Start Steps =====*/
// Joining is a phone call, not a form: the Admin creates the partner account from the number the caller gives (app-spec
// F1). It is a real sequence, so it is numbered, with gold discs as on the home page's evaluation steps.
const STEPS = [
  {
    title: "زنگ بزن",
    detail: "اسم محلت، نوعش (کلینیک، آرایشگاه سگ، پت‌شاپ) و شماره‌ی موبایلی که باهاش وارد می‌شی رو بگو.",
  },
  {
    title: "حساب همکارت ساخته می‌شه",
    detail: `فقط ${HEAD_TRAINER.firstName} حساب همکار می‌سازه، با همون شماره‌ی موبایلت.`,
  },
  {
    title: "وارد می‌شی",
    detail: "لینک، QR و مشتری‌هات رو می‌بینی و شماره‌ی شبات رو برای کمیسیون می‌نویسی.",
  },
];

/*===== How To Start =====*/
/** The three steps from the first call to a working partner account, numbered as a real sequence. */
export function HowToStart() {
  return (
    <section aria-labelledby="start-title">
      <h2 id="start-title" className="font-display text-h2 font-black text-balance">
        چطوری شروع می‌شه؟
      </h2>
      <ol className="mt-8 grid gap-6">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-display text-base font-black text-primary-foreground"
            >
              {formatNumberFa(index + 1)}
            </span>
            <div>
              <p className="font-extrabold">{step.title}</p>
              <p className="mt-1 text-pretty text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
