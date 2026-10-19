import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Steps =====*/
// How buying works, in order (app-spec F5, F6): the course is bought from the cart (upfront, as before), the trainer
// calls, training starts. It is a sequence, so it is numbered. The words follow the owner's notes (2026-10-19): the first
// step doesn't lead with the payment, and the last doesn't promise «private» or «home or outside» (the kind of class is
// arranged on the call; where a course is held is written on its own page).
const STEPS = [
  { title: "دوره را برمی‌داری", detail: "دوره‌ای که انتخاب کردی را از سبد می‌خری." },
  { title: `${HEAD_TRAINER.firstName} زنگ می‌زند`, detail: "نوع کلاس، زمان و جای جلسه‌ها را با هم هماهنگ می‌کنید." },
  { title: "تمرین شروع می‌شود", detail: "جای تمرین هر دوره در صفحه‌ی همان دوره نوشته شده است." },
] as const;

/*===== Closing Band =====*/
/**
 * The page's last word, on a full-width sunken band: why the courses open after the free evaluation, and the three
 * steps after a purchase, which answer "and then what?". It no longer carries a button of its own for the evaluation
 * (the owner wants that ask kept to the menu, the quick actions and the buy card, 2026-10-19): a quiet link goes to the
 * help page's answer. Puts its content back in a `site-container` and carries its own padding.
 */
export function ClosingBand() {
  return (
    <section aria-labelledby="closing-title" className="bg-sunken py-section-md">
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-x-16">
        {/*------ Words ------*/}
        <div>
          <h2 id="closing-title" className="font-display text-h2 font-bold text-balance">
            قبل از دوره، {HEAD_TRAINER.firstName} سگت را می‌بیند
          </h2>
          <p className="mt-3 max-w-[34rem] text-pretty text-muted-foreground">
            دوره‌ها بعد از ارزیابی باز می‌شوند. ارزیابی رایگان است و تعهدی ندارد؛ {HEAD_TRAINER.firstName} سگت را از
            نزدیک می‌بیند و می‌گوید از کجا شروع کنید.
          </p>
          <Link
            to="/help#what-is-evaluation"
            className="mt-5 inline-block rounded-sm font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            ارزیابی چطوریه؟
          </Link>
        </div>

        {/*------ Steps ------*/}
        <ol className="border-b border-border">
          {STEPS.map(({ title, detail }, index) => (
            <li key={title} className="flex items-start gap-4 border-t border-border py-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/45 text-sm font-extrabold text-primary"
              >
                {formatNumberFa(index + 1)}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold">{title}</p>
                <p className="mt-0.5 text-sm text-pretty text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
