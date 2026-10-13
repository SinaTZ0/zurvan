import { SETTING_DEFINITIONS, type SettingKey } from "~/orpc/setting/constants";

/*===== Validation =====*/
/** Whether `value` is a whole number inside the setting's guardrails. `NaN` and infinities are not integers. */
export function isValidSettingValue({ key, value }: { key: SettingKey; value: number }): boolean {
  const { min, max } = SETTING_DEFINITIONS[key];
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * The value in force for a setting: the stored text when it is a valid integer inside the bounds, else the default.
 * A missing row, a hand-edited row or a bound tightened later all mean "use the default", never an error, since the
 * callers (sign-in, the commission) must keep working.
 */
export function resolveSettingValue({ key, stored }: { key: SettingKey; stored: string | null | undefined }): number {
  if (stored === null || stored === undefined || stored.trim() === "") return SETTING_DEFINITIONS[key].defaultValue;

  const value = Number(stored);
  return isValidSettingValue({ key, value }) ? value : SETTING_DEFINITIONS[key].defaultValue;
}
