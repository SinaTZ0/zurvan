/*===== Wallet Constants =====*/
// Browser-safe values shared by the API, the seed and the wallet screens. Stored as plain text (see
// `app/db/schema.ts`).

/*===== System Wallets =====*/
// One of each (spec 3.12). The Admin's receives the platform's part of every sale, and the head trainer's part too (B8).
export const SYSTEM_WALLET_KINDS = ["admin", "gateway", "bank", "withdrawal-hold"] as const;

export type SystemWalletKind = (typeof SYSTEM_WALLET_KINDS)[number];

export const SYSTEM_WALLET_LABELS: Record<SystemWalletKind, string> = {
  admin: "کیف پول مدیر",
  gateway: "درگاه پرداخت",
  bank: "بانک",
  "withdrawal-hold": "در انتظار برداشت",
};

/*===== Transaction Types =====*/
export const TRANSACTION_TYPES = [
  "gateway-payment",
  "purchase",
  "refund",
  "withdrawal-hold",
  "withdrawal-payout",
  "withdrawal-release",
  "manual",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  "gateway-payment": "پرداخت آنلاین",
  purchase: "خرید",
  refund: "بازگشت وجه",
  "withdrawal-hold": "درخواست برداشت",
  "withdrawal-payout": "واریز برداشت",
  "withdrawal-release": "آزاد شدن برداشت",
  manual: "تراکنش دستی",
};

/** Always mirrors of another transaction (entity 18). */
export const MIRROR_TRANSACTION_TYPES = ["refund", "withdrawal-release"] as const satisfies readonly TransactionType[];
