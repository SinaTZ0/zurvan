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
// The example sale the money sentences are worked on: 10,000,000 Toman, kept in Rial like every amount in the app.
const EXAMPLE_SALE_RIAL = 100_000_000;

/*===== Types =====*/
/**
 * One piece of a live sentence: plain words, or `{ value }`, a number worked out from what he typed. The plate sets
 * the values bold and pops each one when it changes, so he sees which part of the sentence his number moved.
 */
export type SentencePart = string | { value: string };

export type SettingCopy = {
  name: string;
  description: string;
  /** Extra muted lines under the description. */
  notes: string[];
  /** Written beside the input. */
  unit: string;
  /** A value with its unit, for «پیش‌فرض: …». */
  formatValue: (value: number) => string;
  /** What this number will do, as one sentence with an example, for a valid number. */
  liveSentence: (value: number) => SentencePart[];
};

/*===== Helpers =====*/
const percent = (value: number) => `${formatNumberFa(value)}٪`;
const perHour = (value: number) => `${formatNumberFa(value)} بار در ساعت`;

/**
 * What the field says for an empty, non-whole or out-of-range number, in the page's spoken Persian. The API keeps its
 * own (written) message for a refusal of its own; this one is the page's.
 */
export function invalidSettingMessage({ min, max }: { min: number; max: number }) {
  return `یه عدد صحیح بین ${formatNumberFa(min)} تا ${formatNumberFa(max)} بنویس.`;
}

/*===== Setting Copy =====*/
/** The words of each setting plate, in the Admin's own vocabulary («پورسانت», «کد ورود»), spoken. */
export const SETTING_COPY: Record<SettingKey, SettingCopy> = {
  [COMMISSION_PERCENT_KEY]: {
    name: "درصد پورسانت همکار",
    description: "پورسانتِ اولین خرید هر مشتری‌ای که همکار آورده.",
    notes: [
      "فقط روی پورسانت‌های بعدی اثر داره؛ پورسانتی که نوشته شده همون درصدِ روز خریدش رو نگه می‌داره.",
      "همین عدد توی صفحه‌ی همکاران، داشبورد خود همکار و صفحه‌ی همکاری با ما دیده می‌شه.",
    ],
    unit: "٪",
    formatValue: percent,
    liveSentence: (value) => [
      `از خریدی به مبلغ ${formatToman(EXAMPLE_SALE_RIAL)}، `,
      { value: formatToman(calculateCommission({ baseAmount: EXAMPLE_SALE_RIAL, percent: value })) },
      " پورسانت می‌نویسیم.",
    ],
  },
  [DEPOSIT_PERCENT_KEY]: {
    name: "پیش‌پرداخت دوره",
    description:
      "چند درصد از قیمت دوره موقع پرداخت گرفته می‌شه؛ بقیه‌ش رو موقع هماهنگی با مشتری حساب می‌کنی. ۱۰۰ یعنی کل مبلغ.",
    notes: [
      "فقط روی پرداخت‌های بعدی اثر داره؛ پرداختی که انجام شده همون درصدِ روز خریدش رو نگه می‌داره.",
      "بقیه‌ی مبلغ بیرون از سایت گرفته می‌شه؛ سایت فقط نشون می‌ده چقدر مونده.",
    ],
    unit: "٪",
    formatValue: percent,
    liveSentence: (value) => {
      const due = calculateDeposit({ total: EXAMPLE_SALE_RIAL, percent: value });
      const sale = `از دوره‌ای به مبلغ ${formatToman(EXAMPLE_SALE_RIAL)}، `;

      return value >= 100
        ? [sale, { value: "کل مبلغ" }, " موقع پرداخت گرفته می‌شه."]
        : [
            sale,
            { value: formatToman(due) },
            " موقع پرداخت گرفته می‌شه و ",
            { value: formatToman(EXAMPLE_SALE_RIAL - due) },
            " می‌مونه برای هماهنگی.",
          ];
    },
  },
  [OTP_PER_PHONE_KEY]: {
    name: "کدهای ورود برای هر شماره",
    description: "هر شماره توی یه ساعت حداکثر این‌قدر کد می‌گیره؛ بیشتر از اون باید صبر کنه.",
    notes: [],
    unit: "بار در ساعت",
    formatValue: perHour,
    liveSentence: (count) => [
      "هر شماره ساعتی ",
      { value: formatNumberFa(count) },
      " کد می‌گیره؛ کد ",
      { value: `${formatNumberFa(count + 1)}ام` },
      " تا ساعت بعد رد می‌شه.",
    ],
  },
  [OTP_PER_IP_KEY]: {
    name: "کدهای ورود برای هر اتصال",
    description: "از یه اتصال اینترنت توی یه ساعت حداکثر این‌قدر کد می‌شه خواست؛ مثلاً همه‌ی گوشی‌های یه مرکز.",
    notes: [],
    unit: "بار در ساعت",
    formatValue: perHour,
    liveSentence: (count) => ["از هر اتصال ساعتی ", { value: formatNumberFa(count) }, " بار می‌شه کد خواست."],
  },
};
