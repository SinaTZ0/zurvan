import { cn } from "cn";

import { ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { describeBreed, describeDogAge, describeWeight } from "~/lib/dog-format";
import { formatJalaliDate } from "~/lib/jalali";
import {
  DOG_BREED_PURITY_LABELS,
  DOG_SEX_LABELS,
  DOG_TRAINING_GOAL_LABELS,
  VACCINATION_STATUS_LABELS,
} from "~/orpc/dog/constants";
import type { AdminDog } from "~/orpc/dog/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { RecordGallery } from "~/routes/admin_dog_detail/components/record-gallery";

/*===== Details Section =====*/
/**
 * The dog's stored fields as a definition list on one plate: from `sm` two pairs to a line (term muted over the value
 * in bold), the notes across the whole width and in full; phones read one pair to a line. No lock icons, unlike the
 * owner's page: the Admin can change the fields that lock for the owner. An empty value says «ثبت نشده», muted.
 *
 * The photos in the dog's file (vaccination card, vet's papers, tattoo) close the list, each under its own small
 * heading; a kind with no photos isn't listed at all.
 *
 * The pairs are a grid with ink hairlines drawn by each pair's own top border (the first line has none), so a short
 * line never leaves a half-drawn rule.
 */
export function DetailsSection({ dog }: { dog: AdminDog }) {
  const empty = <span className="font-normal text-muted-foreground">ثبت نشده</span>;
  const behavior = dog.behaviorNotes?.trim();
  const medical = dog.medicalNotes?.trim();
  const vaccinationNotes = dog.vaccinationNotes?.trim();
  const markings = dog.markings?.trim();
  const breed = describeBreed(dog, "fa");

  /*------ Pairs ------*/
  // The short pairs come in an even number before the first wide one (twelve), so the wide ones start a fresh line and
  // every rule is whole.
  const pairs: { label: string; value: React.ReactNode; wide?: boolean }[] = [
    { label: "نوع نژاد", value: dog.breedPurity ? DOG_BREED_PURITY_LABELS[dog.breedPurity] : empty },
    { label: "نژاد", value: breed ? <bdi>{breed}</bdi> : empty },
    { label: "جنس", value: DOG_SEX_LABELS[dog.sex] },
    {
      label: "تاریخ تولد",
      value: (
        <>
          {formatJalaliDate(dog.birthDate)}
          {dog.birthDateApproximate && " (تقریبی)"}
          <span className="block text-xs font-normal text-muted-foreground">{describeDogAge(dog)}</span>
        </>
      ),
    },
    { label: "وزن", value: describeWeight(dog.weightKg) },
    { label: "قد", value: dog.heightCm === null ? empty : `${formatNumberFa(dog.heightCm)} سانتی‌متر` },
    { label: "عقیم‌شده", value: dog.isNeutered ? "بله" : "نه" },
    { label: "رنگ پوشش", value: dog.coatColor ? <bdi>{dog.coatColor}</bdi> : empty },
    {
      label: "هدف آموزش",
      value:
        dog.trainingGoals.length > 0
          ? dog.trainingGoals.map((goal) => DOG_TRAINING_GOAL_LABELS[goal]).join("، ")
          : empty,
    },
    { label: "واکسن", value: VACCINATION_STATUS_LABELS[dog.vaccinationStatus] },
    {
      label: "میکروچیپ",
      // Digits stay Latin and left to right, as they are printed on the chip; a long one breaks rather than overflows.
      value: dog.microchipNumber ? (
        <span dir="ltr" className="inline-block max-w-full break-all tabular-nums">
          {dog.microchipNumber}
        </span>
      ) : (
        empty
      ),
    },
    {
      label: "تاریخ کاشت میکروچیپ",
      value: dog.microchipImplantedOn ? formatJalaliDate(dog.microchipImplantedOn) : empty,
    },
    { label: "علائم ظاهری", value: markings ? <Note text={markings} /> : empty, wide: true },
    { label: "توضیح واکسن‌ها", value: vaccinationNotes ? <Note text={vaccinationNotes} /> : empty, wide: true },
    { label: "یادداشت رفتاری", value: behavior ? <Note text={behavior} /> : empty, wide: true },
    { label: "یادداشت پزشکی", value: medical ? <Note text={medical} /> : empty, wide: true },
  ];

  /*------ Photos ------*/
  const photoPairs = [
    { label: "عکس کارت واکسن", photos: dog.vaccinationPhotos },
    { label: "عکس مدارک پزشکی", photos: dog.medicalPhotos },
    { label: "عکس تتو", photos: dog.tattooPhoto ? [dog.tattooPhoto] : [] },
  ].filter((pair) => pair.photos.length > 0);
  for (const { label, photos } of photoPairs) {
    pairs.push({ label, value: <RecordGallery photos={photos} what={label} dogName={dog.name} />, wide: true });
  }

  return (
    <DetailSection id="details" title="مشخصات">
      <dl
        className={cn(
          ADMIN_PLATE,
          "grid grid-cols-1 overflow-hidden px-4 sm:grid-cols-2 sm:px-5 sm:[&>div]:pe-6",
          // Each pair draws its own top hairline; the first one on a phone, the first two from `sm`, have none.
          "[&>div]:border-t [&>div]:border-foreground/10 [&>div:first-child]:border-t-0 sm:[&>div:nth-child(2)]:border-t-0",
        )}
      >
        {pairs.map((pair) => (
          <div key={pair.label} className={cn("min-w-0 py-3", pair.wide && "sm:col-span-2")}>
            <dt className="text-xs text-muted-foreground">{pair.label}</dt>
            <dd className="mt-0.5 min-w-0 text-sm font-bold text-pretty">{pair.value}</dd>
          </div>
        ))}
      </dl>
    </DetailSection>
  );
}

/*===== Note =====*/
/** A free-text note in full; the owner's line breaks are kept and a long word breaks. */
function Note({ text }: { text: string }) {
  return (
    <span className="block leading-6 font-normal break-words whitespace-pre-line" dir="auto">
      {text}
    </span>
  );
}
