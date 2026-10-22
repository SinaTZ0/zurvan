import {
  EVALUATION_PERIOD_LABELS,
  EVALUATION_PERIODS,
  EVALUATION_WEEKDAY_LABELS,
  EVALUATION_WEEKDAYS,
  type EvaluationPeriod,
  type EvaluationWeekday,
} from "~/orpc/evaluation/constants";
import { m } from "~/paraglide/messages";

/*===== When The Customer Is Free =====*/
// The weekdays and parts of the day a customer says they are usually free, as an evaluation request and a payment keep
// them (docs/app-spec.md, F3 and F5): two independent lists in one vocabulary. Pure and browser-safe.

type WhenFree = { days: readonly string[]; periods: readonly string[] };

/** Keeps the known values, once each, in the order of the Persian week and of the day; anything else is dropped. */
export function normalizeWhenFree({ days, periods }: WhenFree): {
  days: EvaluationWeekday[];
  periods: EvaluationPeriod[];
} {
  const pickedDays = new Set(days);
  const pickedPeriods = new Set(periods);
  return {
    days: EVALUATION_WEEKDAYS.filter((day) => pickedDays.has(day)),
    periods: EVALUATION_PERIODS.filter((period) => pickedPeriods.has(period)),
  };
}

/**
 * «شنبه، دوشنبه · صبح، عصر و شب» («Saturday, Monday · Morning, Evening and night»), or null when they said nothing.
 * Either list alone reads as itself.
 */
export function describeWhenFree(whenFree: WhenFree): string | null {
  const { days, periods } = normalizeWhenFree(whenFree);
  const joiner = m.shared_when_free_joiner();
  const parts = [
    days.map((day) => EVALUATION_WEEKDAY_LABELS[day]).join(joiner),
    periods.map((period) => EVALUATION_PERIOD_LABELS[period]).join(joiner),
  ].filter((part) => part !== "");
  return parts.length === 0 ? null : parts.join(" · ");
}
