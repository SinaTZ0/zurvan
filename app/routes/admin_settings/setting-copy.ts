import { calculateCommission, calculateDeposit } from "~/lib/business-rules";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import {
  COMMISSION_PERCENT_KEY,
  DEPOSIT_PERCENT_KEY,
  OTP_PER_IP_KEY,
  OTP_PER_PHONE_KEY,
  type SettingKey,
} from "~/orpc/setting/constants";

/*===== Constants =====*/
// The example sale the commission sentence is worked on: 10,000,000 Toman, kept in Rial like every amount in the app.
const EXAMPLE_SALE_RIAL = 100_000_000;

/*===== Setting Copy =====*/
export type SettingCopy = {
  name: string;
  description: string;
  /** Extra muted lines under the description. */
  notes: string[];
  /** Written after the input. */
  unit: string;
  /** What this number will do, as one sentence with an example, for a valid number. */
  liveSentence: (value: number) => string;
};

/** The words of each setting card, in the Admin's own vocabulary («پورسانت», «کد ورود»). */
export const SETTING_COPY: Record<SettingKey, SettingCopy> = {
  [COMMISSION_PERCENT_KEY]: {
    name: "درصد پورسانت همکار",
    description: "پورسانتِ اولین خرید هر مشتری که همکاری او را آورده.",
    notes: [
      "فقط برای پورسانت‌های بعدی؛ پورسانتی که نوشته شده همان درصدی را که روز خریدش بود نگه می‌دارد.",
      "همین عدد در صفحه‌ی همکاران، داشبورد خود همکار و صفحه‌ی همکاری با ما دیده می‌شود.",
    ],
    unit: "٪",
    liveSentence: (percent) =>
      `از خریدی به مبلغ ${formatToman(EXAMPLE_SALE_RIAL)}، ${formatToman(
        calculateCommission({ baseAmount: EXAMPLE_SALE_RIAL, percent }),
      )} پورسانت می‌نویسیم.`,
  },
  [DEPOSIT_PERCENT_KEY]: {
    name: "پیش‌پرداخت دوره",
    description:
      "چند درصد از قیمت دوره موقع پرداخت گرفته می‌شود؛ بقیه را موقع هماهنگی با مشتری حساب می‌کنی. ۱۰۰ یعنی کل مبلغ.",
    notes: [
      "فقط برای پرداخت‌های بعدی؛ پرداختی که انجام شده همان درصدی را که روز خریدش بود نگه می‌دارد.",
      "بقیه‌ی مبلغ بیرون از سایت گرفته می‌شود؛ سایت فقط نشان می‌دهد چقدر مانده.",
    ],
    unit: "٪",
    liveSentence: (percent) => {
      const due = calculateDeposit({ total: EXAMPLE_SALE_RIAL, percent });
      return percent >= 100
        ? `از دوره‌ای به مبلغ ${formatToman(EXAMPLE_SALE_RIAL)}، کل مبلغ موقع پرداخت گرفته می‌شود.`
        : `از دوره‌ای به مبلغ ${formatToman(EXAMPLE_SALE_RIAL)}، ${formatToman(due)} موقع پرداخت گرفته می‌شود و ${formatToman(EXAMPLE_SALE_RIAL - due)} می‌ماند برای هماهنگی.`;
    },
  },
  [OTP_PER_PHONE_KEY]: {
    name: "کدهای ورود برای هر شماره",
    description: "هر شماره در یک ساعت حداکثر این‌قدر کد می‌گیرد؛ بیشتر از آن باید صبر کند.",
    notes: [],
    unit: "بار در ساعت",
    liveSentence: (count) =>
      `هر شماره در ساعت ${formatNumberFa(count)} کد می‌گیرد؛ کد ${formatNumberFa(count + 1)}ام تا ساعت بعد رد می‌شود.`,
  },
  [OTP_PER_IP_KEY]: {
    name: "کدهای ورود برای هر اتصال",
    description: "از یک اتصال اینترنت در یک ساعت حداکثر این‌قدر کد خواسته می‌شود؛ برای مثال همه‌ی گوشی‌های یک مرکز.",
    notes: [],
    unit: "بار در ساعت",
    liveSentence: (count) => `از هر اتصال ${formatNumberFa(count)} درخواست کد در ساعت.`,
  },
};
