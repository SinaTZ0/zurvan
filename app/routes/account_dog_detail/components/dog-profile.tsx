import { cn } from "cn";
import { LockKeyholeIcon } from "lucide-react";

import { MascotCut } from "~/components/mascot-cut";
import { describeDogAge, describeWeight } from "~/lib/dog-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatDate } from "~/lib/locale-format";
import { DOG_SEX_LABELS, VACCINATION_STATUS_LABELS } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { SectionHead } from "~/routes/account_dog_detail/components/section-head";
import { PLATE } from "~/routes/account_dog_detail/plate";
import { m } from "~/paraglide/messages";

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
    {
      label: m.account_dog_detail_profile_breed(),
      value: dog.breed ?? m.account_dog_detail_profile_not_set(),
      locked: dog.isEvaluated,
    },
    { label: m.account_dog_detail_profile_sex(), value: DOG_SEX_LABELS[dog.sex] },
    {
      label: m.account_dog_detail_profile_birth(),
      value: (
        <>
          {dog.birthDateApproximate
            ? m.account_dog_detail_date_approximate({ date: formatDate(dog.birthDate) })
            : formatDate(dog.birthDate)}
          <span className="block text-sm font-normal text-muted-foreground">{describeDogAge(dog)}</span>
        </>
      ),
      locked: dog.isEvaluated,
    },
    { label: m.account_dog_detail_profile_weight(), value: describeWeight(dog.weightKg) },
    {
      label: m.account_dog_detail_profile_neutered(),
      value: dog.isNeutered ? m.account_dog_detail_yes() : m.account_dog_detail_no(),
    },
    { label: m.account_dog_detail_profile_vaccines(), value: VACCINATION_STATUS_LABELS[dog.vaccinationStatus] },
    {
      label: m.account_dog_detail_profile_microchip(),
      // Digits stay Latin and left to right, as they are printed on the chip.
      value: dog.microchipNumber ? (
        <span dir="ltr" className="tabular-nums">
          {dog.microchipNumber}
        </span>
      ) : (
        <span className="font-normal text-muted-foreground">{m.account_dog_detail_profile_not_set()}</span>
      ),
    },
  ];

  const notes = [
    { label: m.account_dog_detail_profile_behavior(), text: dog.behaviorNotes?.trim() },
    { label: m.account_dog_detail_profile_health(), text: dog.medicalNotes?.trim() },
  ].flatMap(({ label, text }) => (text ? [{ label, text }] : []));

  return (
    <section aria-labelledby="profile-title">
      <SectionHead id="profile-title" title={m.account_dog_detail_profile_title()}>
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
            {m.account_dog_detail_profile_lock_note({ trainer: HEAD_TRAINER.firstName })}
          </p>
        )}

        {/*===== Notes =====*/}
        {notes.length > 0 && (
          <dl className="divide-y divide-dashed divide-foreground/15 border-t border-foreground/15">
            {notes.map((note) => (
              <div key={note.label} className="flex flex-col gap-1 py-3">
                <dt className="text-sm text-muted-foreground">{note.label}</dt>
                {/* The owner's own words, in whichever language they typed them. */}
                <dd dir="auto" className="text-pretty whitespace-pre-line">
                  {note.text}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
