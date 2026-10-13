import { describeDogAge, describeWeight } from "~/lib/dog-format";
import { formatJalaliDate } from "~/lib/jalali";
import { DOG_SEX_LABELS, VACCINATION_STATUS_LABELS } from "~/orpc/dog/constants";
import type { AdminDog } from "~/orpc/dog/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";

/*===== Details Section =====*/
/**
 * The dog's stored fields as a ruled list, notes in full. No lock icons, unlike the owner's page: the Admin can change
 * the fields that lock for the owner. An empty value says «ثبت نشده» in muted text.
 */
export function DetailsSection({ dog }: { dog: AdminDog }) {
  const empty = <span className="font-normal text-muted-foreground">ثبت نشده</span>;
  const behavior = dog.behaviorNotes?.trim();
  const medical = dog.medicalNotes?.trim();

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "نژاد", value: dog.breed ? <bdi>{dog.breed}</bdi> : empty },
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
        empty
      ),
    },
    { label: "یادداشت رفتاری", value: behavior ? <Note text={behavior} /> : empty },
    { label: "یادداشت پزشکی", value: medical ? <Note text={medical} /> : empty },
  ];

  return (
    <DetailSection id="details" title="مشخصات">
      <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 py-3 sm:grid sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 text-sm font-bold text-pretty">{row.value}</dd>
          </div>
        ))}
      </dl>
    </DetailSection>
  );
}

/*===== Note =====*/
/** A free-text note in full; the owner's line breaks are kept. */
function Note({ text }: { text: string }) {
  return (
    <span className="block font-normal whitespace-pre-line" dir="auto">
      {text}
    </span>
  );
}
