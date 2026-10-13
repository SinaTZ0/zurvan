import { cn } from "cn";
import type { DeepPartial } from "react-hook-form";

import { ChalkDoodle } from "~/components/chalk-doodle";
import { DogTag } from "~/components/dog-tag";
import { toLatinDigits } from "~/lib/digits";
import { birthDateFromAge, describeDogAge, describeWeight } from "~/lib/dog-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { isValidJalali, jalaliToIso } from "~/lib/jalali";
import { DOG_SEX_LABELS } from "~/orpc/dog/constants";
import type { Media } from "~/orpc/media/contract";
import { DogBubble } from "~/routes/account_dog_form/components/dog-bubble";
import { PhotoPicker } from "~/routes/account_dog_form/components/photo-picker";
import type { DogFormInput } from "~/routes/account_dog_form/schema";
import type { DogFormSection } from "~/routes/account_dog_form/sections";

/*===== Dog Card =====*/
// The props below are the contract `dog-form.tsx` is written against. Don't change them without telling the coordinator.

export type DogCardProps = {
  /** The form's live values (`useWatch({ control })`): name, sex, birth parts, weight, microchip, notes… */
  values: DeepPartial<DogFormInput>;
  /** The uploaded photo (the form only stores its id); null when none. */
  photo: Media | null;
  /** The picker uploaded a new photo, or removed it (null). */
  onPhotoChange: (media: Media | null) => void;
  /** True while an upload runs, so the form can disable submit. */
  onBusyChange: (busy: boolean) => void;
  /** A server message about the photo, from saving the form. */
  photoError?: string;
  /** The section the owner is in; picks the bubble's line. */
  section: DogFormSection;
  /** Editing an existing dog (false: adding a new one). */
  isEdit: boolean;
  /** The dog is evaluated: birth date and breed are locked (changes the identity line). */
  isEvaluated: boolean;
  /** Grid placement from the form (sticky, columns, rows). */
  className?: string;
};

/**
 * The dog's page as it is being written: its photo (the photo IS the picker), its name stamped in as the owner types,
 * the facts line, and the dog's bubble following the section the owner is in. On desktop it also shows what the head
 * trainer will read first in the notes.
 *
 * One grid, two layouts (the picker is rendered once, so CSS only moves things):
 * - Phones: a strip (a 96px photo slot at the start, the name and facts beside it) with the bubble under it, its tail
 *   pointing up at the slot. The notes are left out so the form starts on the first screen.
 * - Desktop: the bubble on top with its tail down at the photo, the 4:3 frame, the picker's actions, the name and facts,
 *   and the notes.
 *
 * The name, facts and notes are a visual echo of the inputs, so they are `aria-hidden`; only the picker's controls are
 * read. Grid rows are placed explicitly, which keeps the DOM in reading order (picker first) while the bubble sits on
 * top on desktop and under the strip on phones.
 */
export function DogCard({
  values,
  photo,
  onPhotoChange,
  onBusyChange,
  photoError,
  section,
  isEdit,
  isEvaluated,
  className,
}: DogCardProps) {
  const name = values.name?.trim() ?? "";
  // Shown as it will be saved: Latin digits, no spaces.
  const microchipNumber = toLatinDigits(values.microchipNumber ?? "").replace(/\s+/g, "") || null;
  const facts = describePartialFacts(values);
  const notes = [values.behaviorNotes, values.medicalNotes].map((note) => note?.trim()).filter(Boolean);

  return (
    <aside
      aria-label="پیش‌نمایش"
      // Phone rows: the name (takes the slack so it stays beside the 96px slot), the picker's actions, the bubble.
      className={cn(
        "relative grid grid-cols-[6rem_minmax(0,1fr)] grid-rows-[1fr_auto_auto] gap-x-4 lg:grid-cols-1 lg:grid-rows-none lg:gap-x-0",
        className,
      )}
    >
      {/*===== Photo Picker =====*/}
      <PhotoPicker
        media={photo}
        onChange={onPhotoChange}
        onBusyChange={onBusyChange}
        error={photoError}
        // Desktop's empty frame shows the engraved tag; an empty name reads as a question mark until it is typed.
        fallback={<DogTag name={name || "؟"} microchipNumber={microchipNumber} size="lg" stampKey={name} />}
        frameClassName="col-start-1 row-span-2 row-start-1 size-24 lg:row-span-1 lg:row-start-2 lg:h-auto lg:w-full lg:aspect-4/3"
        actionsClassName="col-start-2 row-start-2 self-start lg:col-start-1 lg:row-start-3 lg:mt-3"
      />

      {/*===== Name and Facts =====*/}
      <div
        aria-hidden
        className="col-start-2 row-start-1 min-w-0 self-center lg:col-start-1 lg:row-start-4 lg:mt-5 lg:self-auto"
      >
        {/* Keyed by the name so every change remounts it and replays the stamp, as on the tag. */}
        <p
          key={name}
          className={cn(
            "truncate font-display text-2xl font-bold lg:text-3xl",
            name ? "motion-safe:animate-tag-stamp" : "text-muted-foreground",
          )}
        >
          {/* A dog's name can be Latin; `bdi` keeps it from flipping the sentence around it. */}
          {name ? <bdi>{name}</bdi> : "اسم من"}
        </p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{facts || "جنس، سن و وزنش اینجا می‌آید."}</p>
      </div>

      {/*===== Bubble =====*/}
      {/* Phones: under the strip, with room above for the tail that points up at the photo. Desktop: above the frame. */}
      <DogBubble
        section={section}
        isEdit={isEdit}
        isEvaluated={isEvaluated}
        className="col-span-2 row-start-3 mt-9 lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:mb-8"
      />

      {/*===== What The Trainer Reads =====*/}
      <div aria-hidden className="mt-6 hidden border-t pt-5 lg:col-start-1 lg:row-start-5 lg:block">
        <p className="text-sm font-bold text-primary">{HEAD_TRAINER.firstName} قبل از اولین جلسه می‌خواند</p>
        {notes.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2 text-sm text-pretty">
            {notes.map((note) => (
              <li key={note} className="line-clamp-2 border-s-2 border-primary/40 ps-3">
                {note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-pretty text-muted-foreground">
            هر چیزی که از رفتار و سلامتش بدانی، جلسه‌ی اول را جلو می‌اندازد.
          </p>
        )}
      </div>

      {/*===== Doodle =====*/}
      {/* The page's one doodle, beside the bubble: at the bubble's end on both layouts. */}
      <ChalkDoodle
        name="heart"
        className="absolute end-1 bottom-0 w-10 rotate-12 lg:end-2 lg:top-0 lg:bottom-auto lg:w-14 lg:-rotate-6"
      />
    </aside>
  );
}

/*===== Facts =====*/
/** The facts line from whatever has been filled in so far; parts still empty are left out. */
function describePartialFacts(values: DeepPartial<DogFormInput>): string {
  const parts: string[] = [];
  if (values.sex) parts.push(DOG_SEX_LABELS[values.sex]);

  const birthDate = previewBirthDate(values);
  if (birthDate) {
    parts.push(describeDogAge({ birthDate, birthDateApproximate: values.birthMode === "approximate" }));
  }

  const weight = Number(toLatinDigits(values.weight ?? "").replace(/[٫,/]/g, "."));
  if (values.weight && !Number.isNaN(weight) && weight > 0) parts.push(describeWeight(weight));

  return parts.join("، ");
}

/** The birth date the form's parts add up to, or null while they are incomplete or not a real date. */
function previewBirthDate(values: DeepPartial<DogFormInput>): string | null {
  if (values.birthMode === "approximate") {
    if (!values.ageYears || !values.ageMonths) return null;
    return birthDateFromAge({ years: Number(values.ageYears), months: Number(values.ageMonths) });
  }
  const date = { year: Number(values.birthYear), month: Number(values.birthMonth), day: Number(values.birthDay) };
  return date.year && date.month && date.day && isValidJalali(date) ? jalaliToIso(date) : null;
}
