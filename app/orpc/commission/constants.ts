/*===== Commission Constants =====*/
/** The `platform_setting` key of the partner's commission steps (F7, F10), stored as JSON. */
export const COMMISSION_TIERS_SETTING_KEY = "partner_commission_tiers";

/*------ Guardrails ------*/
// Against a typo, not business rules: over 50% would pay a partner more than the shop keeps.

/** Always five steps (the owner, 2026-10-25); fewer is the same percent on the top ones. */
export const COMMISSION_TIER_COUNT = 5;
export const MAX_COMMISSION_TIER_FROM = 1000;
export const MIN_COMMISSION_TIER_PERCENT = 1;
export const MAX_COMMISSION_TIER_PERCENT = 50;
