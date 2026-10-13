import type { DatabaseOrTransaction } from "~/db/client.server";
import { OTP_PER_IP_KEY, OTP_PER_PHONE_KEY, SETTING_DEFINITIONS } from "~/orpc/setting/constants";
import { findSettingRows } from "~/orpc/setting/repository";
import { resolveSettingValue } from "~/orpc/setting/validation";

/*===== OTP Limits =====*/
/**
 * The sign-in code limits in force (F10): requests per phone number and per connection (IP) per hour. Read on every
 * send, so a change by the Admin applies without a restart.
 *
 * Never throws: a missing row, a value that is not an integer or is out of its bounds, or a failed read all mean the
 * default. Sign-in has to keep working whatever the settings table holds.
 */
export async function readOtpLimits({
  db,
}: {
  db: DatabaseOrTransaction;
}): Promise<{ perPhone: number; perIp: number }> {
  try {
    const rows = await findSettingRows({ db });
    const stored = (key: string) => rows.find((row) => row.key === key)?.value;
    return {
      perPhone: resolveSettingValue({ key: OTP_PER_PHONE_KEY, stored: stored(OTP_PER_PHONE_KEY) }),
      perIp: resolveSettingValue({ key: OTP_PER_IP_KEY, stored: stored(OTP_PER_IP_KEY) }),
    };
  } catch {
    return {
      perPhone: SETTING_DEFINITIONS[OTP_PER_PHONE_KEY].defaultValue,
      perIp: SETTING_DEFINITIONS[OTP_PER_IP_KEY].defaultValue,
    };
  }
}
