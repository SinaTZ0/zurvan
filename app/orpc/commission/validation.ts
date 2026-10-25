import { DEFAULT_COMMISSION_TIERS, type CommissionTier } from "~/lib/business-rules";
import {
  COMMISSION_TIER_COUNT,
  MAX_COMMISSION_TIER_FROM,
  MAX_COMMISSION_TIER_PERCENT,
  MIN_COMMISSION_TIER_PERCENT,
} from "~/orpc/commission/constants";

/*===== Validation =====*/
// Browser-safe: the Admin's tier editor checks with the same rules the server saves with.

/**
 * Why `tiers` can't be saved, in Persian for the Admin, or null when it can: exactly five steps, the first from the 1st
 * customer, each later one from a later customer (at most the 1000th), and every percent a whole number from 1 to 50.
 * Neighbouring steps may share a percent (that is how there are fewer).
 */
export function commissionTiersError(tiers: readonly CommissionTier[]): string | null {
  if (tiers.length !== COMMISSION_TIER_COUNT) return "پنج پله لازمه.";
  if (tiers[0]?.fromCustomer !== 1) return "پله‌ی اول باید از مشتری اول شروع بشه.";

  for (const [index, tier] of tiers.entries()) {
    if (!Number.isInteger(tier.fromCustomer) || tier.fromCustomer < 1 || tier.fromCustomer > MAX_COMMISSION_TIER_FROM) {
      return "شماره‌ی مشتری باید یه عدد صحیح بین ۱ تا ۱۰۰۰ باشه.";
    }
    const previous = tiers[index - 1];
    if (previous && tier.fromCustomer <= previous.fromCustomer) {
      return "هر پله باید از مشتری بعدتری نسبت به پله‌ی قبلش شروع بشه.";
    }
    if (
      !Number.isInteger(tier.percent) ||
      tier.percent < MIN_COMMISSION_TIER_PERCENT ||
      tier.percent > MAX_COMMISSION_TIER_PERCENT
    ) {
      return "درصد باید یه عدد صحیح بین ۱ تا ۵۰ باشه.";
    }
  }
  return null;
}

/**
 * The steps in force from the stored JSON: the stored ones when they parse and pass `commissionTiersError`, else the
 * default. A missing row or a hand-edited one means the default, never an error, since the payment callback must keep
 * working.
 */
export function resolveCommissionTiers(stored: string | null | undefined): CommissionTier[] {
  if (!stored) return [...DEFAULT_COMMISSION_TIERS];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...DEFAULT_COMMISSION_TIERS];
    const tiers = parsed.map((item: { fromCustomer?: unknown; percent?: unknown }) => ({
      fromCustomer: Number(item?.fromCustomer),
      percent: Number(item?.percent),
    }));
    return commissionTiersError(tiers) === null ? tiers : [...DEFAULT_COMMISSION_TIERS];
  } catch {
    return [...DEFAULT_COMMISSION_TIERS];
  }
}
