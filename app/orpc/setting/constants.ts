import {
  DEFAULT_DEPOSIT_PERCENT,
  DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR,
  DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR,
} from "~/lib/business-rules";
import { COMMISSION_TIERS_SETTING_KEY } from "~/orpc/commission/constants";

/*===== Setting Constants =====*/
// Browser-safe. The settings the Admin can change without a release (docs/app-spec.md, F10), in the order the page
// shows them. A missing `platform_setting` row means the default. The partner's commission steps are a table, not a
// number, so they have their own procedures (`setting.admin.commissionTiers`); the keys below are the numbers.

export const COMMISSION_TIERS_KEY = COMMISSION_TIERS_SETTING_KEY;
export const DEPOSIT_PERCENT_KEY = "deposit_percent";
export const OTP_PER_PHONE_KEY = "otp_requests_per_phone_per_hour";
export const OTP_PER_IP_KEY = "otp_requests_per_ip_per_hour";

export const SETTING_KEYS = [DEPOSIT_PERCENT_KEY, OTP_PER_PHONE_KEY, OTP_PER_IP_KEY] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/**
 * Defaults and bounds. The bounds are guardrails against a typo (0 codes would lock everyone out), not business rules.
 */
export const SETTING_DEFINITIONS: Record<
  SettingKey,
  { defaultValue: number; min: number; max: number; invalidMessage: string }
> = {
  [DEPOSIT_PERCENT_KEY]: {
    defaultValue: DEFAULT_DEPOSIT_PERCENT,
    min: 1,
    max: 100,
    invalidMessage: "درصد باید یه عدد صحیح بین ۱ تا ۱۰۰ باشه.",
  },
  [OTP_PER_PHONE_KEY]: {
    defaultValue: DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR,
    min: 1,
    max: 30,
    invalidMessage: "عدد باید صحیح و بین ۱ تا ۳۰ باشه.",
  },
  [OTP_PER_IP_KEY]: {
    defaultValue: DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR,
    min: 5,
    max: 200,
    invalidMessage: "عدد باید صحیح و بین ۵ تا ۲۰۰ باشه.",
  },
};
