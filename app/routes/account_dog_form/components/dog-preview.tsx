import type { DeepPartial } from "react-hook-form";

import { DogPortrait } from "~/components/dog-portrait";
import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import { toLatinDigits } from "~/lib/digits";
import { birthDateFromAge, describeDogAge, describeWeight } from "~/lib/dog-format";
import { isValidJalali, jalaliToIso } from "~/lib/jalali";
import { DOG_SEX_LABELS } from "~/orpc/dog/constants";
import type { Media } from "~/orpc/media/contract";
import type { DogFormInput } from "~/routes/account_dog_form/schema";

/*===== Dog Preview =====*/
/**
 * The dog's page header as it will look, built from the form as it is typed: the photo with its tag, the name stamped
 * in, and the facts line. On desktop it also shows what Arman will read first in the notes.
 */
export function DogPreview({ values, photo }: { values: DeepPartial<DogFormInput>; photo: Media | null }) {
  // Short on purpose: the tag has room for a name, not a sentence.
  const name = values.name?.trim() || "سگت";
  // Shown as it will be saved: Latin digits, no spaces.
  const microchipNumber = toLatinDigits(values.microchipNumber ?? "").replace(/\s+/g, "") || null;
  const facts = describePartialFacts(values);
  const notes = [values.behaviorNotes, values.medicalNotes].map((note) => note?.trim()).filter(Boolean);

  return (
    <div className="rounded-3xl bg-sunken p-4 shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)] lg:p-8">
      {/*------ Phone Strip ------*/}
      {/* Phones keep the preview short, so the form starts on the first screen. */}
      <div className="flex items-center gap-4 lg:hidden">
        {photo && <MediaImage media={photo} variant="thumb" alt="" className="size-20 shrink-0 rounded-2xl" />}
        <DogTag name={name} microchipNumber={microchipNumber} size="sm" stampKey={name} className="text-[10px]" />
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-bold">{name}</p>
          <p className="text-sm text-muted-foreground">{facts || "جنس، سن و وزنش اینجا می‌آید."}</p>
        </div>
      </div>

      {/*------ Desktop Portrait ------*/}
      <div className="hidden lg:block">
        <DogPortrait name={name} microchipNumber={microchipNumber} photo={photo} stampKey={name} />
        <p className="mt-6 text-sm text-muted-foreground">{facts || "جنس، سن و وزنش اینجا نوشته می‌شود."}</p>
      </div>

      {/*------ What Arman Reads ------*/}
      <div className="mt-6 hidden border-t pt-5 lg:block">
        <p className="text-sm font-bold text-saffron-text">آرمان قبل از اولین جلسه می‌خواند</p>
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
    </div>
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

function previewBirthDate(values: DeepPartial<DogFormInput>): string | null {
  if (values.birthMode === "approximate") {
    if (!values.ageYears || !values.ageMonths) return null;
    return birthDateFromAge({ years: Number(values.ageYears), months: Number(values.ageMonths) });
  }
  const date = { year: Number(values.birthYear), month: Number(values.birthMonth), day: Number(values.birthDay) };
  return date.year && date.month && date.day && isValidJalali(date) ? jalaliToIso(date) : null;
}
