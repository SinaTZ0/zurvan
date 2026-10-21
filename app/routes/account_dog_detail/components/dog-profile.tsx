import { cn } from "cn";
import { LockKeyholeIcon } from "lucide-react";

import { MascotCut } from "~/components/mascot-cut";
import { describeDogAge, describeWeight } from "~/lib/dog-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatJalaliDate } from "~/lib/jalali";
import { DOG_SEX_LABELS, VACCINATION_STATUS_LABELS } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { SectionHead } from "~/routes/account_dog_detail/components/section-head";
import { PLATE } from "~/routes/account_dog_detail/plate";

/*===== Dog Profile =====*/
/**
 * «مشخصات» (it was the shared `DogProfile`; this page was its only reader): the dog's identity and health as ruled
 * label and value rows on a grained plate, then the owner's behaviour and medical notes when there are any. Once the
 * dog is evaluated, the breed and birth date are locked to the head trainer (F2): a small lock beside each, and the line
 * under the rows says who can change them.
 *
 * The dog's bowls (dimmed scenery) stand on the plate's top edge: this is the everyday side of the file.
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
    <section aria-labelledby="profile-title">
      <SectionHead id="profile-title" title="مشخصات">
        <MascotCut name="bowls" className="w-32 translate-y-[4%] sm:w-36" />
      </SectionHead>

      <div className={cn(PLATE, "px-5 py-2 sm:px-6")}>
        {/*===== Rows =====*/}
        <dl className="divide-y divide-dashed divide-foreground/15">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-6 py-3">
              <dt className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                {row.label}
                {row.locked && <LockKeyholeIcon aria-hidden className="size-3.5 text-primary/70" />}
              </dt>
              <dd className="min-w-0 text-end font-bold text-pretty">{row.value}</dd>
            </div>
          ))}
        </dl>

        {dog.isEvaluated && (
          <p className="flex items-start gap-2 border-t border-foreground/15 py-3 text-sm text-pretty text-muted-foreground">
            <LockKeyholeIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
            بعد از ارزیابی فقط {HEAD_TRAINER.firstName} می‌تونه نژاد و تاریخ تولد رو عوض کنه.
          </p>
        )}

        {/*===== Notes =====*/}
        {notes.length > 0 && (
          <dl className="divide-y divide-dashed divide-foreground/15 border-t border-foreground/15">
            {notes.map((note) => (
              <div key={note.label} className="flex flex-col gap-1 py-3">
                <dt className="text-sm text-muted-foreground">{note.label}</dt>
                <dd className="text-pretty whitespace-pre-line">{note.text}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
