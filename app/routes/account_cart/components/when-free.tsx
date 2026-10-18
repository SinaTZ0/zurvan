import { ChoiceChip } from "~/components/choice-chip";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import {
  EVALUATION_PERIOD_LABELS,
  EVALUATION_PERIODS,
  EVALUATION_WEEKDAY_LABELS,
  EVALUATION_WEEKDAYS,
  type EvaluationPeriod,
  type EvaluationWeekday,
} from "~/orpc/evaluation/constants";

/*===== When Free =====*/
/**
 * «کی هماهنگ کنیم؟» (F5): optional. The weekdays and parts of the day the customer is usually free, sent with «پرداخت» so
 * the call that arranges the lessons starts from them. It books nothing, and the page says so.
 */
export function WhenFree({
  days,
  periods,
  onDaysChange,
  onPeriodsChange,
}: {
  days: readonly EvaluationWeekday[];
  periods: readonly EvaluationPeriod[];
  onDaysChange: (days: EvaluationWeekday[]) => void;
  onPeriodsChange: (periods: EvaluationPeriod[]) => void;
}) {
  return (
    <section aria-labelledby="cart-when-free-title" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 id="cart-when-free-title" className="text-xl font-extrabold">
        کی هماهنگ کنیم؟ <span className="text-sm font-normal text-muted-foreground">(اختیاری)</span>
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
        روزها و ساعت‌هایی که معمولاً آزادی را بزن تا {HEAD_TRAINER.firstName} موقع تماس از همان‌ها شروع کنه. این فقط یه
        ترجیحه: جایی رزرو نمی‌شه و وقت دقیق موقع تماس مشخص می‌شه.
      </p>

      <div className="mt-5 flex flex-col gap-5">
        <ChipGroup
          name="availableDays"
          legend="چه روزهایی معمولاً آزادی؟"
          options={EVALUATION_WEEKDAYS.map((value) => ({ value, label: EVALUATION_WEEKDAY_LABELS[value] }))}
          picked={days}
          onChange={onDaysChange}
        />
        <ChipGroup
          name="availablePeriods"
          legend="چه ساعتی از روز؟"
          options={EVALUATION_PERIODS.map((value) => ({ value, label: EVALUATION_PERIOD_LABELS[value] }))}
          picked={periods}
          onChange={onPeriodsChange}
        />
      </div>
    </section>
  );
}

/*===== Chip Group =====*/
/** A labelled row of toggle chips; the picked values stay in the options' order, whatever order they were tapped in. */
function ChipGroup<Value extends string>({
  name,
  legend,
  options,
  picked,
  onChange,
}: {
  name: string;
  legend: string;
  options: readonly { value: Value; label: string }[];
  picked: readonly Value[];
  onChange: (picked: Value[]) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ChoiceChip
            key={option.value}
            name={name}
            label={option.label}
            checked={picked.includes(option.value)}
            onChange={(checked) =>
              onChange(
                options
                  .map((item) => item.value)
                  .filter((value) => (value === option.value ? checked : picked.includes(value))),
              )
            }
          />
        ))}
      </div>
    </fieldset>
  );
}
