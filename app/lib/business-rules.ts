/*===== Business Rules =====*/
// Working defaults for the open business rules (section 5 of `docs/app-phase-one.md`). They are
// not final: each one is tagged `TODO(business-logic)` with its section in
// `docs/business-logic.md`, so `grep -rn "TODO(business-logic)" app` lists everything to revisit.
// Browser-safe: checkout and refund previews use the same math as the server.
//
// All amounts are integer Rial.

/*===== Platform Setting Defaults =====*/
// Initial values for Platform Settings (entity 25). The Admin can change them at runtime.

// TODO(business-logic): B2 — per-course trainer share, pre-filled from this default.
export const DEFAULT_TRAINER_SHARE_PERCENT = 70;

// TODO(business-logic): B2, B3 — one global partner commission, no per-partner rate.
export const DEFAULT_PARTNER_COMMISSION_PERCENT = 10;

// TODO(business-logic): B7
export const DEFAULT_MIN_WITHDRAWAL_RIAL = 1_000_000;

// TODO(business-logic): B7
export const DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR = 5;

// TODO(business-logic): B7
export const DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR = 20;

// TODO(business-logic): B11 — a session the customer cancels later than this before it starts counts as missed.
export const DEFAULT_LATE_SESSION_CANCELLATION_HOURS = 24;

// TODO(business-logic): B12 — a test is refunded in full until this long before its session, and not after.
export const DEFAULT_TEST_REFUND_CUTOFF_HOURS = 24;

/*===== Purchase Split =====*/

/** The signed lines of one enrollment's purchase transaction, by wallet role. They add up to 0. */
export type PurchaseSplit = {
  customer: number;
  trainer: number;
  admin: number;
  partner: number;
};

/**
 * Largest trainer share a course can have, so the Admin's line is never negative.
 */
// TODO(business-logic): B4 — the Admin's line must never be negative.
export function maxTrainerSharePercent(partnerCommissionPercent: number): number {
  return 100 - partnerCommissionPercent;
}

/**
 * Splits one enrollment's paid amount between the trainer, the partner and the Admin.
 *
 * Percentages apply to the paid amount (after discount). Trainer and partner lines round down and
 * the Admin takes the remainder, so the lines always add up to 0. A zero line means the wallet is
 * left out of the transaction; a `paidAmount` of 0 creates no purchase transaction at all.
 *
 * @throws RangeError when the shares exceed 100%, which would make the Admin's line negative.
 */
// TODO(business-logic): B1 — the partner is paid from the Admin's part; the trainer's line never changes.
// TODO(business-logic): B4 — discounts shrink every share proportionally.
// TODO(business-logic): B6 — round trainer and partner down, Admin takes the remainder.
export function splitPurchase({
  paidAmount,
  trainerSharePercent,
  partnerCommissionPercent,
  hasPartner,
}: {
  paidAmount: number;
  trainerSharePercent: number;
  partnerCommissionPercent: number;
  hasPartner: boolean;
}): PurchaseSplit {
  const partnerPercent = hasPartner ? partnerCommissionPercent : 0;
  if (trainerSharePercent + partnerPercent > 100) {
    throw new RangeError("Trainer share and partner commission exceed 100%.");
  }

  const trainer = Math.floor((paidAmount * trainerSharePercent) / 100);
  const partner = Math.floor((paidAmount * partnerPercent) / 100);

  return {
    customer: -paidAmount,
    trainer,
    admin: paidAmount - trainer - partner,
    partner,
  };
}

/*===== Refunds =====*/

/**
 * Refund for one enrollment, rounded down to whole Rial. `refundPercent` is the effective share to give back,
 * which B11 works out from the held sessions and the refund policy.
 */
// TODO(business-logic): B6, B11
export function calculateRefundAmount({
  paidAmount,
  refundPercent,
}: {
  paidAmount: number;
  refundPercent: number;
}): number {
  return Math.floor((paidAmount * refundPercent) / 100);
}

/**
 * Builds the refund lines for a purchase: a proportional mirror where the customer gets
 * `refundAmount` back and every other wallet returns the same fraction of what it received.
 * With `refundAmount` equal to the paid amount it is the exact mirror.
 */
// TODO(business-logic): B5 — partial refunds are a proportional mirror.
// TODO(business-logic): B6 — round trainer and partner down, Admin takes the remainder.
export function splitRefund({
  purchase,
  refundAmount,
}: {
  purchase: PurchaseSplit;
  refundAmount: number;
}): PurchaseSplit {
  const paidAmount = -purchase.customer;
  if (refundAmount < 0 || refundAmount > paidAmount) {
    throw new RangeError("Refund amount must be between 0 and the paid amount.");
  }

  const trainer = paidAmount === 0 ? 0 : Math.floor((purchase.trainer * refundAmount) / paidAmount);
  const partner = paidAmount === 0 ? 0 : Math.floor((purchase.partner * refundAmount) / paidAmount);

  return {
    customer: refundAmount,
    trainer: -trainer,
    admin: -(refundAmount - trainer - partner),
    partner: -partner,
  };
}

/*===== Enrollment Refunds =====*/

/** Which rule decided an enrollment's refund, so the screens can explain the amount. */
export type EnrollmentRefundRule =
  /** Cancelled before the first session was held: everything comes back (B11). */
  | "before-first-session"
  /** Cancelled by the customer after that: the policy's share of the unheld sessions (B11). */
  | "policy"
  /** Cancelled by the trainer or the Admin: the whole share of the unheld sessions (B11). */
  | "staff"
  /** A test, more than the cut-off before its session (B12). */
  | "test-before-cutoff"
  /** A test inside the cut-off, or already held (B12). */
  | "test-after-cutoff";

export type EnrollmentRefund = { amount: number; rule: EnrollmentRefundRule };

/**
 * What cancelling an enrollment now gives back, in Rial. One function for the server and the customer's preview, so
 * the amount on the button is the amount refunded.
 *
 * - A course cancelled by the customer: everything until a session is used, then
 *   `paid × unheld ÷ planned × policy %`.
 * - A course cancelled by the trainer or the Admin: `paid × unheld ÷ planned`, ignoring the policy.
 * - A test: everything until the cut-off before its session, nothing after (a used session is past the cut-off). The
 *   trainer or the Admin cancelling a test that hasn't been used gives everything back.
 *
 * `usedSessions` are held plus missed ones. More used than planned leaves nothing unheld.
 */
// TODO(business-logic): B11, B12
export function calculateEnrollmentRefund({
  kind,
  paidAmount,
  plannedSessions,
  usedSessions,
  policyPercent,
  cancelledBy,
  nextSessionStartsAt,
  now,
}: {
  kind: "course" | "test";
  paidAmount: number;
  plannedSessions: number;
  usedSessions: number;
  /** The refund policy's share of the unheld sessions, from the order item's snapshot. */
  policyPercent: number;
  cancelledBy: "customer" | "staff";
  /** The earliest scheduled session, which the test cut-off is measured from. */
  nextSessionStartsAt: Date | null;
  now: Date;
}): EnrollmentRefund {
  /*------ Tests ------*/
  if (kind === "test") {
    const cutoff = DEFAULT_TEST_REFUND_CUTOFF_HOURS * 3_600_000;
    const pastCutoff =
      usedSessions > 0 ||
      (cancelledBy === "customer" &&
        nextSessionStartsAt !== null &&
        nextSessionStartsAt.getTime() - now.getTime() < cutoff);
    return pastCutoff ? { amount: 0, rule: "test-after-cutoff" } : { amount: paidAmount, rule: "test-before-cutoff" };
  }

  /*------ Courses ------*/
  if (usedSessions === 0) return { amount: paidAmount, rule: "before-first-session" };

  const unheld = Math.max(plannedSessions - usedSessions, 0);
  const percent = cancelledBy === "staff" ? 100 : policyPercent;
  return {
    amount: Math.floor((paidAmount * unheld * percent) / (plannedSessions * 100)),
    rule: cancelledBy === "staff" ? "staff" : "policy",
  };
}

/*===== Discounts =====*/

/**
 * Spreads a fixed order discount across items in proportion to their price. Each share rounds
 * down, then the leftover Rial go one each to the items with the largest rounding remainders, so
 * the shares add up to `discount` and no item is discounted below 0.
 *
 * @returns Each item's discount, in the same order as `itemPrices`.
 */
// TODO(business-logic): B6
export function allocateDiscount({ itemPrices, discount }: { itemPrices: number[]; discount: number }): number[] {
  const subtotal = itemPrices.reduce((sum, price) => sum + price, 0);
  if (subtotal === 0) return itemPrices.map(() => 0);

  const capped = Math.min(discount, subtotal);
  const shares = itemPrices.map((price) => Math.floor((capped * price) / subtotal));

  /*------ Distribute Leftover ------*/
  // Fewer leftover Rial than items, and only items with a remainder get one, so each stays within its price.
  let leftover = capped - shares.reduce((sum, share) => sum + share, 0);
  const byRemainder = itemPrices.map((price, index) => ({
    index,
    remainder: (capped * price) % subtotal,
  }));
  // `toSorted` needs ES2023 types; sorting this freshly mapped array mutates nothing shared.
  // oxlint-disable-next-line unicorn/no-array-sort
  byRemainder.sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (leftover === 0) break;
    shares[index] += 1;
    leftover -= 1;
  }

  return shares;
}
