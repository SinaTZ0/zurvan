import { cn } from "cn";
import { CpuIcon, StethoscopeIcon, SyringeIcon, type LucideIcon } from "lucide-react";
import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { DOG_RECORD_PHOTO_LIMITS, VACCINATION_STATUS_LABELS, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import { ImplantDateField } from "~/routes/account_dog_form/components/implant-date-field";
import { RecordPhotosField } from "~/routes/account_dog_form/components/record-photos-field";
import type { DogFormInput, DogFormValues } from "~/routes/account_dog_form/schema";

/** The hint of a list of photos: how many, which formats, one page each. */
const photoHint = (max: number) => m.account_dog_form_record_hint({ max: formatNumber(max) });

/*===== Health Fields =====*/
/**
 * The dog's health papers, all optional, in three groups as they sit in a real file: the vaccinations (the status, the
 * card's photos, the owner's own words about them), the microchip and the tattoo (the number, the day it went in, a
 * photo of the tattoo), and the vet (the medical note and the papers' photos). The photos upload as they are picked.
 * `photos` are the dog's stored ones when editing; `onBusy` tells the form which photo field is still uploading.
 */
export function HealthFields({
  photos,
  onBusy,
}: {
  photos: Pick<Dog, "vaccinationPhotos" | "medicalPhotos" | "tattooPhoto"> | null;
  onBusy: (part: string, busy: boolean) => void;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<DogFormInput, unknown, DogFormValues>();

  return (
    <>
      {/*------ Vaccinations ------*/}
      <Group icon={SyringeIcon} title={m.account_dog_form_group_vaccines()} first>
        <ChoicePills
          legend={m.account_dog_form_field_vaccines()}
          options={VACCINATION_STATUSES.map((status) => ({ value: status, label: VACCINATION_STATUS_LABELS[status] }))}
          registration={register("vaccinationStatus")}
          error={errors.vaccinationStatus}
        />

        <RecordPhotosField
          name="vaccinationPhotoIds"
          label={m.account_dog_form_field_vaccination_photos()}
          hint={photoHint(DOG_RECORD_PHOTO_LIMITS.vaccination)}
          max={DOG_RECORD_PHOTO_LIMITS.vaccination}
          initial={photos?.vaccinationPhotos ?? []}
          onBusyChange={(busy) => onBusy("vaccination", busy)}
        />

        <Field data-invalid={!!errors.vaccinationNotes}>
          <FieldLabel htmlFor="dog-vaccination-notes">
            {m.account_dog_form_field_vaccination_notes()}{" "}
            <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
          </FieldLabel>
          <Textarea
            id="dog-vaccination-notes"
            rows={2}
            className="min-h-20"
            placeholder={m.account_dog_form_vaccination_notes_placeholder()}
            aria-invalid={!!errors.vaccinationNotes}
            {...register("vaccinationNotes")}
          />
          <FieldError key={errors.vaccinationNotes?.message} errors={[errors.vaccinationNotes]} className="answer-in" />
        </Field>
      </Group>

      {/*------ Microchip and Tattoo ------*/}
      <Group icon={CpuIcon} title={m.account_dog_form_group_chip()}>
        <Field data-invalid={!!errors.microchipNumber}>
          <FieldLabel htmlFor="dog-microchip">
            {m.account_dog_form_field_microchip()}{" "}
            <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
          </FieldLabel>
          <Input
            id="dog-microchip"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            // Digits run left to right in both languages; on the Persian page they still sit at the start (right).
            // `rtl:` matches through the page's `dir`, not the input's own `dir="ltr"`, so English keeps the left.
            className="tabular-nums rtl:text-right"
            aria-invalid={!!errors.microchipNumber}
            {...register("microchipNumber")}
          />
          <FieldDescription>{m.account_dog_form_microchip_hint()}</FieldDescription>
          <FieldError key={errors.microchipNumber?.message} errors={[errors.microchipNumber]} className="answer-in" />
        </Field>

        <ImplantDateField />

        <RecordPhotosField
          name="tattooPhotoIds"
          label={m.account_dog_form_field_tattoo_photo()}
          hint={m.account_dog_form_tattoo_hint()}
          max={DOG_RECORD_PHOTO_LIMITS.tattoo}
          initial={photos?.tattooPhoto ? [photos.tattooPhoto] : []}
          onBusyChange={(busy) => onBusy("tattoo", busy)}
        />
      </Group>

      {/*------ The Vet ------*/}
      <Group icon={StethoscopeIcon} title={m.account_dog_form_group_vet()}>
        <Field data-invalid={!!errors.medicalNotes}>
          <FieldLabel htmlFor="dog-medical">
            {m.account_dog_form_field_medical()}{" "}
            <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
          </FieldLabel>
          <Textarea
            id="dog-medical"
            placeholder={m.account_dog_form_medical_placeholder()}
            aria-invalid={!!errors.medicalNotes}
            {...register("medicalNotes")}
          />
          <FieldError key={errors.medicalNotes?.message} errors={[errors.medicalNotes]} className="answer-in" />
        </Field>

        <RecordPhotosField
          name="medicalPhotoIds"
          label={m.account_dog_form_field_medical_photos()}
          hint={photoHint(DOG_RECORD_PHOTO_LIMITS.medical)}
          max={DOG_RECORD_PHOTO_LIMITS.medical}
          initial={photos?.medicalPhotos ?? []}
          onBusyChange={(busy) => onBusy("medical", busy)}
        />
      </Group>
    </>
  );
}

/*===== Group =====*/
/** One part of the health plate under a small heading with its gold line icon; the parts are parted by a chalk dash. */
function Group({
  icon: Icon,
  title,
  first = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-6", !first && "border-t border-dashed border-foreground/15 pt-7")}
    >
      <h3 id={headingId} className="flex items-center gap-2 text-base font-bold">
        <Icon aria-hidden strokeWidth={1.75} className="size-5 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}
