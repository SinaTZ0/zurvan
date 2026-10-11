import { describeDogAge, describeWeight } from "~/lib/dog-format";
import { formatJalaliDate } from "~/lib/jalali";
import { DOG_SEX_LABELS, VACCINATION_STATUS_LABELS } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Profile =====*/
/** The dog's identity and health as a ruled list of label and value pairs. */
export function DogProfile({ dog }: { dog: Dog }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "نژاد", value: dog.breed ?? "ثبت نشده" },
    { label: "جنس", value: DOG_SEX_LABELS[dog.sex] },
    {
      label: "تاریخ تولد",
      value: (
        <>
          {formatJalaliDate(dog.birthDate)}
          {dog.birthDateApproximate && " (تقریبی)"}
          <span className="block text-sm font-normal text-muted-foreground">{describeDogAge(dog)}</span>
        </>
      ),
    },
    { label: "وزن", value: describeWeight(dog.weightKg) },
    { label: "عقیم‌شده", value: dog.isNeutered ? "بله" : "نه" },
    { label: "واکسن", value: VACCINATION_STATUS_LABELS[dog.vaccinationStatus] },
    {
      label: "میکروچیپ",
      // Digits stay Latin and left to right, as they are printed on the chip.
      value: dog.microchipNumber ? (
        <span dir="ltr" className="tabular-nums">
          {dog.microchipNumber}
        </span>
      ) : (
        <span className="font-normal text-muted-foreground">ثبت نشده</span>
      ),
    },
  ];

  return (
    <section aria-labelledby="profile-title">
      <h2 id="profile-title" className="border-b pb-3 text-lg font-extrabold">
        مشخصات
      </h2>
      <dl className="divide-y">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6 py-3">
            <dt className="shrink-0 text-sm text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 text-end font-bold text-pretty">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
