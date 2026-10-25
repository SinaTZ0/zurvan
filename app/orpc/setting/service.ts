import type { DatabaseOrTransaction } from "~/db/client.server";
import { DEFAULT_COMMISSION_TIERS, type CommissionTier } from "~/lib/business-rules";
import { findCommissionTiers } from "~/orpc/commission/repository";
import { commissionTiersError, resolveCommissionTiers } from "~/orpc/commission/validation";
import { COMMISSION_TIERS_KEY, SETTING_DEFINITIONS, SETTING_KEYS, type SettingKey } from "~/orpc/setting/constants";
import type { AdminCommissionTiers, AdminSetting } from "~/orpc/setting/contract";
import { toAdminSetting } from "~/orpc/setting/mapper";
import { findSettingRow, findSettingRows, upsertSetting, upsertSettingText } from "~/orpc/setting/repository";
import { isValidSettingValue } from "~/orpc/setting/validation";

/*===== Types =====*/
type UpdateSettingResult =
  { kind: "success"; setting: AdminSetting } | { kind: "invalid"; fields: Record<string, string> };

type UpdateCommissionTiersResult =
  { kind: "success"; tiers: AdminCommissionTiers } | { kind: "invalid"; fields: Record<string, string> };

/*===== Admin =====*/
/** F10: the three number settings in `SETTING_KEYS` order, each with the value in force (stored, else the default). */
export async function adminGetSettings({ db }: { db: DatabaseOrTransaction }): Promise<AdminSetting[]> {
  const rows = await findSettingRows({ db });
  return SETTING_KEYS.map((key) => toAdminSetting({ key, record: rows.find((row) => row.key === key) }));
}

/**
 * F10: saves one setting. The bounds are guardrails against a typo (0 sign-in codes would lock everyone out), so a
 * value outside them, or not a whole number, writes nothing.
 *
 * The change applies to the next request that reads it; nothing is cached, and rows already written (a payment's
 * deposit percent) keep the value they were written with.
 */
export async function updateSetting({
  db,
  key,
  value,
}: {
  db: DatabaseOrTransaction;
  key: SettingKey;
  value: number;
}): Promise<UpdateSettingResult> {
  if (!isValidSettingValue({ key, value })) {
    return { kind: "invalid", fields: { value: SETTING_DEFINITIONS[key].invalidMessage } };
  }

  const record = await upsertSetting({ db, key, value });
  return { kind: "success", setting: toAdminSetting({ key, record }) };
}

/*===== Commission Steps =====*/
/** F7, F10: the partner's commission steps in force, next to the default ones. */
export async function adminGetCommissionTiers({ db }: { db: DatabaseOrTransaction }): Promise<AdminCommissionTiers> {
  const record = await findSettingRow({ db, key: COMMISSION_TIERS_KEY });
  return {
    tiers: resolveCommissionTiers(record?.value),
    defaultTiers: [...DEFAULT_COMMISSION_TIERS],
    updatedAt: record?.updatedAt ?? null,
  };
}

/**
 * F7, F10: replaces the partner's commission steps. Steps that break the guardrails write nothing. The next commission
 * is written with the new steps; commissions already written keep their percent.
 */
export async function updateCommissionTiers({
  db,
  tiers,
}: {
  db: DatabaseOrTransaction;
  tiers: CommissionTier[];
}): Promise<UpdateCommissionTiersResult> {
  const error = commissionTiersError(tiers);
  if (error) return { kind: "invalid", fields: { tiers: error } };

  const stored = tiers.map(({ fromCustomer, percent }) => ({ fromCustomer, percent }));
  const record = await upsertSettingText({ db, key: COMMISSION_TIERS_KEY, value: JSON.stringify(stored) });
  return {
    kind: "success",
    tiers: { tiers: stored, defaultTiers: [...DEFAULT_COMMISSION_TIERS], updatedAt: record.updatedAt },
  };
}

/*===== Public =====*/
/** The steps a new commission would be read against, the same read `recordPurchaseCommission` makes. */
export async function getCommissionTiers({ db }: { db: DatabaseOrTransaction }): Promise<{ tiers: CommissionTier[] }> {
  return { tiers: await findCommissionTiers({ db }) };
}
