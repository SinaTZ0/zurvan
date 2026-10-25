/*===== Business Rules =====*/
// Working defaults for the business rules of docs/app-spec.md. Browser-safe: the screens use the same math as the
// server.
//
// All amounts are integer Rial.

/*===== Platform Setting Defaults =====*/
// Initial values for the settings the Admin can change at runtime (F10).

/**
 * A step of the partner's commission (F7): from the partner's `fromCustomer`-th paying customer on, each new commission
 * is `percent` of the purchase. The steps are ordered by `fromCustomer`, and the first starts at 1.
 */
export type CommissionTier = { fromCustomer: number; percent: number };

/**
 * F7: there are always five steps (the owner, 2026-10-25); for fewer, the Admin gives the top ones the same percent.
 * The default is the table in the owner's partner notes: 1 to 3 customers 10%, the 4th 12%, 5 to 8 15% («۵ تا ۸»), the
 * 9th (not in the notes) 15% as well, 10 and over 18%. The Admin changes it in Settings.
 */
export const DEFAULT_COMMISSION_TIERS: readonly CommissionTier[] = [
  { fromCustomer: 1, percent: 10 },
  { fromCustomer: 4, percent: 12 },
  { fromCustomer: 5, percent: 15 },
  { fromCustomer: 9, percent: 15 },
  { fromCustomer: 10, percent: 18 },
];

/**
 * F5: the share of a course's price taken when the customer pays; the rest is settled when the trainer arranges the
 * lessons. 100 means the whole price, which is what happens until the owner approves a deposit (the owner mentioned 50%).
 */
export const DEFAULT_DEPOSIT_PERCENT = 100;

export const DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR = 5;

export const DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR = 20;

/*===== Deposit =====*/

/**
 * What is taken now of a total (F5): `percent` of it, rounded **up** to the Rial so the deposit is never less than its
 * share, and never more than the total. 100 percent is the whole total.
 */
export function calculateDeposit({ total, percent }: { total: number; percent: number }): number {
  if (percent >= 100) return total;
  return Math.min(total, Math.ceil((total * percent) / 100));
}

/*===== Commission =====*/

/**
 * The percent of the step a partner's `customerCount`-th paying customer falls on (F7): the last step whose
 * `fromCustomer` is at most the count. A count under 1 is read as the first customer. `tiers` must be valid (ordered,
 * starting at 1); the settings never hand out any other.
 */
export function commissionPercentFor({
  tiers,
  customerCount,
}: {
  tiers: readonly CommissionTier[];
  customerCount: number;
}): number {
  let percent = tiers[0]?.percent ?? 0;
  for (const tier of tiers) {
    if (tier.fromCustomer <= Math.max(customerCount, 1)) percent = tier.percent;
  }
  return percent;
}

/** A step as the customers it covers: `toCustomer` is the last one on it, or null for the last step (and every one after). */
export type CommissionTierRange = CommissionTier & { toCustomer: number | null };

/**
 * The steps as the partners see them, with where each one ends. Neighbouring steps with the same percent are one step
 * here: that is how the Admin makes fewer than five (5 to 8 and 9 at 15% read as «۵–۹: ۱۵٪»).
 */
export function commissionTierRanges(tiers: readonly CommissionTier[]): CommissionTierRange[] {
  const merged = tiers.filter((tier, index) => index === 0 || tier.percent !== tiers[index - 1]?.percent);
  return merged.map((tier, index) => {
    const next = merged[index + 1];
    return { ...tier, toCustomer: next ? next.fromCustomer - 1 : null };
  });
}

/**
 * The partner's commission on one paid purchase (F7): a percentage of the total of the enrollments that payment created,
 * rounded down to the Rial.
 */
export function calculateCommission({ baseAmount, percent }: { baseAmount: number; percent: number }): number {
  return Math.floor((baseAmount * percent) / 100);
}
