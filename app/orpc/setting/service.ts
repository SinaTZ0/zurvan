import type { DatabaseOrTransaction } from "~/db/client.server";
import { DEFAULT_PARTNER_COMMISSION_PERCENT } from "~/lib/business-rules";
import { findCommissionPercentSetting } from "~/orpc/commission/repository";
import { SETTING_DEFINITIONS, SETTING_KEYS, type SettingKey } from "~/orpc/setting/constants";
import type { AdminSetting } from "~/orpc/setting/contract";
import { toAdminSetting } from "~/orpc/setting/mapper";
import { findSettingRows, upsertSetting } from "~/orpc/setting/repository";
import { isValidSettingValue } from "~/orpc/setting/validation";

/*===== Types =====*/
type UpdateSettingResult =
  { kind: "success"; setting: AdminSetting } | { kind: "invalid"; fields: Record<string, string> };

/*===== Admin =====*/
/** F10: the four settings in `SETTING_KEYS` order, each with the value in force (stored, else the default). */
export async function adminGetSettings({ db }: { db: DatabaseOrTransaction }): Promise<AdminSetting[]> {
  const rows = await findSettingRows({ db });
  return SETTING_KEYS.map((key) => toAdminSetting({ key, record: rows.find((row) => row.key === key) }));
}

/**
 * F10: saves one setting. The bounds are guardrails against a typo (100% would pay a partner the whole sale; 0 sign-in
 * codes would lock everyone out), so a value outside them, or not a whole number, writes nothing.
 *
 * The change applies to the next request that reads it; nothing is cached, and rows already written (a commission's
 * `percent`) keep the value they were written with.
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

/*===== Public =====*/
/** The percent a new commission would be written with, the same read `recordFirstPurchaseCommission` makes. */
export async function getCommissionPercent({ db }: { db: DatabaseOrTransaction }): Promise<{ percent: number }> {
  return { percent: (await findCommissionPercentSetting({ db })) ?? DEFAULT_PARTNER_COMMISSION_PERCENT };
}
