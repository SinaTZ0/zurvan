import { cn } from "cn";

import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { formatJalaliDate } from "~/lib/jalali";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import {
  EVALUATION_PERIOD_LABELS,
  EVALUATION_WEEKDAY_LABELS,
  type EvaluationPeriod,
  type EvaluationWeekday,
} from "~/orpc/evaluation/constants";

/*===== Next Steps =====*/
// What happens after the request, as the home page's evaluation panel tells it (app-spec F3, F5, F6).
const NEXT_STEPS = [
  `${HEAD_TRAINER.firstName} بهت زنگ می‌زنه، وقت می‌گذارید و میاد سگت را می‌بینه.`,
  "بعد از ارزیابی، دوره‌هایی که برای سگت مناسبه باز می‌شن.",
  `بعد از خرید، ${HEAD_TRAINER.firstName} زنگ می‌زنه و جلسه‌ها را با هم هماهنگ می‌کنید.`,
];

/*===== Request Sent =====*/
/**
 * Replaces the form card in place once the request is in. The dog's «رسید!» is said by the guide beside it (the one
 * speech bubble on the page); this card says what was sent and what happens next. Withdrawing a request is not here:
 * it lives on the dog's page (F3).
 */
export function RequestSent({
  dogName,
  earliestDate,
  availableDays,
  availablePeriods,
  anotherDogRequestable,
  onAnotherDog,
}: {
  dogName: string;
  /** `YYYY-MM-DD`. */
  earliestDate: string;
  availableDays: readonly EvaluationWeekday[];
  availablePeriods: readonly EvaluationPeriod[];
  /** Another dog of theirs can still ask for an evaluation. */
  anotherDogRequestable: boolean;
  onAnotherDog: () => void;
}) {
  return (
    <section
      aria-labelledby="request-sent-title"
      className="rounded-4xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10"
    >
      <h2 id="request-sent-title" className="text-2xl font-extrabold text-balance">
        درخواست ارزیابی {dogName} ثبت شد
      </h2>

      {/*------ What Was Sent ------*/}
      <dl className="mt-6 grid gap-x-8 gap-y-4 rounded-2xl bg-sunken p-5 sm:grid-cols-2">
        <SummaryItem term="سگ" detail={dogName} />
        <SummaryItem term="از چه روزی" detail={formatJalaliDate(earliestDate)} />
        <SummaryItem
          term="روزهای آزاد"
          detail={availableDays.map((day) => EVALUATION_WEEKDAY_LABELS[day]).join("، ")}
        />
        <SummaryItem
          term="ساعت‌های آزاد"
          detail={availablePeriods.map((period) => EVALUATION_PERIOD_LABELS[period]).join("، ")}
        />
      </dl>

      {/*------ Next Steps ------*/}
      <h3 className="mt-8 font-extrabold">از این به بعد چی می‌شه؟</h3>
      <ol className="mt-4 flex flex-col gap-4">
        {NEXT_STEPS.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-black text-primary-foreground"
            >
              {(index + 1).toLocaleString("fa-IR")}
            </span>
            <p className="pt-0.5 text-pretty text-muted-foreground">{step}</p>
          </li>
        ))}
      </ol>

      {/*------ Actions ------*/}
      <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <Link to="/account" className={cn(buttonVariants({ size: "lg" }), "sm:min-w-52")}>
          برو به حساب من
        </Link>
        {anotherDogRequestable && (
          <Button
            type="button"
            variant="link"
            onClick={onAnotherDog}
            className="h-auto self-center rounded-sm p-0 text-sm sm:self-auto"
          >
            ارزیابی برای سگ دیگر
          </Button>
        )}
      </div>
    </section>
  );
}

/*===== Summary Item =====*/
function SummaryItem({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="mt-0.5 font-bold text-pretty">{detail}</dd>
    </div>
  );
}
