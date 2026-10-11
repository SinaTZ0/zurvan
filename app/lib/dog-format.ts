import { formatNumberFa } from "~/lib/digits";
import { todayIso } from "~/lib/jalali";
import { DOG_SEX_LABELS } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Facts =====*/
// Every page words a dog's facts the same way: «نر، حدوداً ۳ ساله، ۳۲٫۵ کیلو». Age is always calculated from the
// birth date, never stored, and an owner who only knew the age gets «حدوداً». Browser-safe.

type AgeFacts = Pick<Dog, "birthDate" | "birthDateApproximate">;

/*===== Age =====*/
/** Whole months between a birth date and today (both `YYYY-MM-DD`). Never negative. */
export function ageInMonths({ birthDate, today = todayIso() }: { birthDate: string; today?: string }): number {
  const [birthYear = 0, birthMonth = 0, birthDay = 0] = birthDate.split("-").map(Number);
  const [year = 0, month = 0, day = 0] = today.split("-").map(Number);
  const months = (year - birthYear) * 12 + (month - birthMonth) - (day < birthDay ? 1 : 0);
  return Math.max(0, months);
}

/**
 * «۸ ماهه», «۱ سال و ۴ ماهه», «۳ ساله». Months are kept up to two years, where they still matter for training; an
 * approximate age is rounded to what the owner said and starts with «حدوداً».
 */
export function describeDogAge(dog: AgeFacts, today?: string): string {
  const months = ageInMonths({ birthDate: dog.birthDate, today });
  const prefix = dog.birthDateApproximate ? "حدوداً " : "";

  if (months < 1) return "کمتر از یک ماه";
  if (months < 12) return `${prefix}${formatNumberFa(months)} ماهه`;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years < 2 && rest > 0 && !dog.birthDateApproximate) {
    return `${formatNumberFa(years)} سال و ${formatNumberFa(rest)} ماهه`;
  }
  return `${prefix}${formatNumberFa(years)} ساله`;
}

/**
 * The birth date for an age the owner gave in years and months («حدودی می‌دانم»), as `YYYY-MM-DD`: today minus that
 * age, on the first of the month, since the day was never known.
 */
export function birthDateFromAge({
  years,
  months,
  today = todayIso(),
}: {
  years: number;
  months: number;
  today?: string;
}): string {
  const [year = 0, month = 0] = today.split("-").map(Number);
  const total = year * 12 + (month - 1) - (years * 12 + months);
  const birthYear = Math.floor(total / 12);
  const birthMonth = (total % 12) + 1;
  return `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`;
}

/** The reverse of `birthDateFromAge`, to fill the form when editing a dog whose age was approximate. */
export function ageFromBirthDate({ birthDate, today }: { birthDate: string; today?: string }) {
  const months = ageInMonths({ birthDate, today });
  return { years: Math.floor(months / 12), months: months % 12 };
}

/*===== Weight =====*/
/** «۳۲٫۵ کیلو». */
export function describeWeight(weightKg: number): string {
  return `${formatNumberFa(weightKg)} کیلو`;
}

/*===== Facts Line =====*/
/** «نر، حدوداً ۳ ساله، ۳۲٫۵ کیلو»: the short line under a dog's name. */
export function describeDog(dog: Pick<Dog, "sex" | "birthDate" | "birthDateApproximate" | "weightKg">): string {
  return [DOG_SEX_LABELS[dog.sex], describeDogAge(dog), describeWeight(dog.weightKg)].join("، ");
}
