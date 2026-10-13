import { Lock } from "lucide-react";

import { describeDogAge, describeWeight } from "~/lib/dog-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatJalaliDate } from "~/lib/jalali";
import { DOG_SEX_LABELS, VACCINATION_STATUS_LABELS } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Profile =====*/
/**
 * The dog's identity and health as a ruled list of label and value pairs, then the owner's behavior and medical notes
 * when there are any. Once the dog is evaluated, the breed and birth date are locked to the head trainer (F2), which
 * the lock icons and the line under the list explain.
 */
export function DogProfile({ dog }: { dog: Dog }) {
  const rows: { label: string; value: React.ReactNode; locked?: boolean }[] = [
    { label: "نژاد", value: dog.breed ?? "ثبت نشده", locked: dog.isEvaluated },
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
      locked: dog.isEvaluated,
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

  const notes = [
    { label: "رفتار", text: dog.behaviorNotes?.trim() },
    { label: "سلامت", text: dog.medicalNotes?.trim() },
  ].filter((note): note is { label: string; text: string } => Boolean(note.text));

  return (
    <section aria-labelledby="profile-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="profile-title" className="border-b pb-3 font-sans text-lg font-extrabold">
        مشخصات
      </h2>

      {/*===== Rows =====*/}
      <dl className="divide-y">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6 py-3">
            <dt className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
              {row.label}
              {row.locked && <Lock aria-hidden className="size-3.5 text-muted-foreground" />}
            </dt>
            <dd className="min-w-0 text-end font-bold text-pretty">{row.value}</dd>
          </div>
        ))}
      </dl>

      {dog.isEvaluated && (
        <p className="border-t pt-3 text-sm text-pretty text-muted-foreground">
          بعد از ارزیابی فقط {HEAD_TRAINER.firstName} می‌تونه نژاد و تاریخ تولد را عوض کنه.
        </p>
      )}

      {/*===== Notes =====*/}
      {notes.length > 0 && (
        <dl className="mt-3 divide-y border-t">
          {notes.map((note) => (
            <div key={note.label} className="flex flex-col gap-1 py-3">
              <dt className="text-sm text-muted-foreground">{note.label}</dt>
              <dd className="text-pretty whitespace-pre-line">{note.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
