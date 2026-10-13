import type { AdminSetting } from "~/orpc/setting/contract";
import { SETTING_DEFINITIONS, type SettingKey } from "~/orpc/setting/constants";
import type { SettingRecord } from "~/orpc/setting/repository";
import { resolveSettingValue } from "~/orpc/setting/validation";

/** The setting as the Admin sees it: the value in force next to its default and bounds. `record` is null until saved. */
export function toAdminSetting({ key, record }: { key: SettingKey; record: SettingRecord | undefined }): AdminSetting {
  const { defaultValue, min, max } = SETTING_DEFINITIONS[key];
  return {
    key,
    value: resolveSettingValue({ key, stored: record?.value }),
    defaultValue,
    min,
    max,
    updatedAt: record?.updatedAt ?? null,
  };
}
