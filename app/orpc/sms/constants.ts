/*===== SMS Constants =====*/
// Browser-safe values shared by the SMS API, the outbox page and `app/lib/sms.server.ts` (docs/app-spec.md, F9).

export const SMS_KINDS = [
  "sign-in-code",
  "evaluation-requested",
  "evaluation-evaluated",
  "evaluation-rejected",
  "payment-paid",
  "payment-paid-admin",
  "enrollment-completed",
  "enrollment-cancelled",
  "commission-paid",
  "refund-paid",
] as const;

export type SmsKind = (typeof SMS_KINDS)[number];

export const SMS_KIND_LABELS: Record<SmsKind, string> = {
  "sign-in-code": "کد ورود",
  "evaluation-requested": "درخواست ارزیابی (به مدیر)",
  "evaluation-evaluated": "ارزیابی شد",
  "evaluation-rejected": "ارزیابی رد شد",
  "payment-paid": "رسید خرید",
  "payment-paid-admin": "خرید تازه (به مدیر)",
  "enrollment-completed": "تمام شد",
  "enrollment-cancelled": "لغو شد",
  "commission-paid": "پورسانت پرداخت شد",
  "refund-paid": "بازپرداخت پرداخت شد",
};

/** Messages per page of the outbox. */
export const SMS_PAGE_SIZE = 30;
