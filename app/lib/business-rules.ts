/*===== Business Rules =====*/
// Working defaults for the business rules of docs/app-spec.md. Browser-safe: the screens use the same math as the
// server.
//
// All amounts are integer Rial.

/*===== Platform Setting Defaults =====*/
// Initial values for the settings the Admin can change at runtime (F10).

/** F7: the partner's share of a customer's first paid purchase. */
export const DEFAULT_PARTNER_COMMISSION_PERCENT = 10;

export const DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR = 5;

export const DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR = 20;

/*===== Commission =====*/

/**
 * The partner's commission on a customer's first paid purchase (F7): a percentage of the total of the enrollments that
 * payment created, rounded down to the Rial.
 */
export function calculateCommission({ baseAmount, percent }: { baseAmount: number; percent: number }): number {
  return Math.floor((baseAmount * percent) / 100);
}
