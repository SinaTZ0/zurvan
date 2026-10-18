import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";

/*===== Deposit Wording =====*/
// Browser-safe. A payment that took a deposit says so the same way on every page: how much of the full price it is, and what
// is left, which is settled when the lessons are arranged, outside the app.

type DepositFacts = {
  /** Rial charged at the gateway. */
  amount: number;
  /** Rial: the full price of what was bought. */
  totalAmount: number;
  depositPercent: number;
};

/** Whether the payment took less than the full price. */
export function tookDeposit({ amount, totalAmount }: Pick<DepositFacts, "amount" | "totalAmount">): boolean {
  return amount < totalAmount;
}

/** «پیش‌پرداخت ٪۵۰ از ۹٬۵۰۰٬۰۰۰ تومان», or `null` for a payment of the whole price. */
export function describeDeposit(facts: DepositFacts): string | null {
  if (!tookDeposit(facts)) return null;
  return `پیش‌پرداخت ٪${formatNumberFa(facts.depositPercent)} از ${formatToman(facts.totalAmount)}`;
}

/** «بقیه ۴٬۷۵۰٬۰۰۰ تومان»: what is left of the full price, or `null` when nothing is. */
export function describeBalance(facts: DepositFacts): string | null {
  if (!tookDeposit(facts)) return null;
  return `بقیه ${formatToman(facts.totalAmount - facts.amount)}`;
}
