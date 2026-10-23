import { todayIso } from "~/lib/jalali";
import { formatNumber } from "~/lib/locale-format";
import { DOG_SEX_LABELS } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { m } from "~/paraglide/messages";
import { getLocale, type Locale } from "~/paraglide/runtime";

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
 * «۸ ماهه», «۱ سال و ۴ ماهه», «۳ ساله» («8 months old» on the English pages). Months are kept up to two years, where
 * they still matter for training; an approximate age is rounded to what the owner said and starts with «حدوداً».
 * `locale` is the page's by default; a procedure passes its request's.
 */
export function describeDogAge(dog: AgeFacts, today?: string, locale: Locale = getLocale()): string {
  const months = ageInMonths({ birthDate: dog.birthDate, today });
  const options = { locale };
  const approximate = (age: string) =>
    dog.birthDateApproximate ? m.shared_dog_age_approximate({ age }, options) : age;

  if (months < 1) return m.shared_dog_age_under_month({}, options);
  if (months < 12) {
    const count = formatNumber(months, locale);
    return approximate(
      months === 1 ? m.shared_dog_age_month_one({ count }, options) : m.shared_dog_age_months({ count }, options),
    );
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years < 2 && rest > 0 && !dog.birthDateApproximate) {
    const parts = { years: formatNumber(years, locale), months: formatNumber(rest, locale) };
    return rest === 1
      ? m.shared_dog_age_year_and_month_one(parts, options)
      : m.shared_dog_age_year_and_months(parts, options);
  }
  const count = formatNumber(years, locale);
  return approximate(
    years === 1 ? m.shared_dog_age_year_one({ count }, options) : m.shared_dog_age_years({ count }, options),
  );
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
/** «۳۲٫۵ کیلو», or «32.5 kg» on the English pages. */
export function describeWeight(weightKg: number): string {
  return m.shared_dog_weight({ weight: formatNumber(weightKg) });
}

/*===== Facts Line =====*/
/** «نر، حدوداً ۳ ساله، ۳۲٫۵ کیلو» («Male, about 3 years old, 32.5 kg»): the short line under a dog's name. */
export function describeDog(dog: Pick<Dog, "sex" | "birthDate" | "birthDateApproximate" | "weightKg">): string {
  const age = describeDogAge(dog);
  // English capitalizes the age where it starts a line («About 3 years old»), but not inside this one.
  const ageInLine = getLocale() === "en" ? age.charAt(0).toLowerCase() + age.slice(1) : age;
  return [DOG_SEX_LABELS[dog.sex], ageInLine, describeWeight(dog.weightKg)].join(m.shared_dog_facts_joiner());
}
