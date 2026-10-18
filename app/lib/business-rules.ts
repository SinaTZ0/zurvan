/*===== Business Rules =====*/
// Working defaults for the business rules of docs/app-spec.md. Browser-safe: the screens use the same math as the
// server.
//
// All amounts are integer Rial.

/*===== Platform Setting Defaults =====*/
// Initial values for the settings the Admin can change at runtime (F10).

/** F7: the partner's share of a customer's first paid purchase. */
export const DEFAULT_PARTNER_COMMISSION_PERCENT = 10;

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
 * The partner's commission on a customer's first paid purchase (F7): a percentage of the total of the enrollments that
 * payment created, rounded down to the Rial.
 */
export function calculateCommission({ baseAmount, percent }: { baseAmount: number; percent: number }): number {
  return Math.floor((baseAmount * percent) / 100);
}
