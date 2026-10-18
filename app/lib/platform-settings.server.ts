import type { DatabaseOrTransaction } from "~/db/client.server";
import { DEPOSIT_PERCENT_KEY, OTP_PER_IP_KEY, OTP_PER_PHONE_KEY, SETTING_DEFINITIONS } from "~/orpc/setting/constants";
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

/*===== Deposit =====*/
/**
 * The share of a course's price taken when a customer pays (F10): the Admin's setting, else 100 (the whole price). Read on
 * every «پرداخت», so a change applies to the next payment; a payment keeps the percent it was made with.
 *
 * Never throws: a missing row, a value that is not an integer or is out of its bounds, or a failed read all mean the
 * default, so a payment is never started at a percent nobody chose.
 */
export async function readDepositPercent({ db }: { db: DatabaseOrTransaction }): Promise<number> {
  try {
    const rows = await findSettingRows({ db });
    return resolveSettingValue({
      key: DEPOSIT_PERCENT_KEY,
      stored: rows.find((row) => row.key === DEPOSIT_PERCENT_KEY)?.value,
    });
  } catch {
    return SETTING_DEFINITIONS[DEPOSIT_PERCENT_KEY].defaultValue;
  }
}

