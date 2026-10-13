import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import type { ApiFailure } from "~/lib/api-error";
import { DOG_SEX_LABELS, DOG_SEXES, VACCINATION_STATUS_LABELS, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import type { AdminDog } from "~/orpc/dog/contract";
import { BREED_SUGGESTIONS } from "~/routes/admin_dog_detail/breeds";
import { BirthDateField } from "~/routes/admin_dog_detail/components/birth-date-field";
import { ChoicePills } from "~/routes/admin_dog_detail/components/choice-pills";
import {
  type DogEditInput,
  type DogEditValues,
  dogEditSchema,
  SAME_NAME_FIELDS,
  SERVER_FIELD_TO_FORM,
  toAdminUpdateInput,
  toFormDefaults,
} from "~/routes/admin_dog_detail/schema";

/*===== Types =====*/
export type DogUpdateInput = ReturnType<typeof toAdminUpdateInput>;

/*===== Edit Form =====*/
/**
 * The dog's details as a form, inside the edit sheet: a scrolling body and a footer with «ذخیره» / «انصراف». The sheet
 * owns the request; this component validates, hands the sheet the API input, and puts the sheet's `failure` back on the
 * fields (`data.fields`) and in the alert above the buttons. Input is kept after a failure.
 */
export function EditForm({
  dog,
  isPending,
  failure,
  onSubmit,
  onCancel,
}: {
  dog: AdminDog;
  isPending: boolean;
  failure: ApiFailure | null;
  onSubmit: (input: DogUpdateInput) => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<DogEditInput, unknown, DogEditValues>({
    resolver: zodResolver(dogEditSchema),
    defaultValues: toFormDefaults(dog),
  });

  /*------ Server Messages ------*/
  // The API validates again; its per-field messages go next to the field. A field the form doesn't have (it shouldn't
  // happen) is added to the alert instead of being lost.
  const orphanMessages: string[] = [];
  useEffect(() => {
    if (!failure) return;
    for (const [field, message] of Object.entries(failure.fields)) {
      const target =
        SERVER_FIELD_TO_FORM[field] ?? (SAME_NAME_FIELDS.has(field) ? (field as keyof DogEditInput) : null);
      if (target) setError(target, { message });
    }
  }, [failure, setError]);
  for (const [field, message] of Object.entries(failure?.fields ?? {})) {
    if (!SERVER_FIELD_TO_FORM[field] && !SAME_NAME_FIELDS.has(field)) orphanMessages.push(message);
  }
  const alert = [failure?.message, ...orphanMessages].filter(Boolean).join(" ");

  const submit = handleSubmit((values) => onSubmit(toAdminUpdateInput({ values, dogId: dog.id })));

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      {/*===== Fields (scrolling) =====*/}
      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {/*------ Name ------*/}
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="edit-dog-name">نام</FieldLabel>
          <Input id="edit-dog-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        {/*------ Breed ------*/}
        <Field data-invalid={!!errors.breed}>
          <FieldLabel htmlFor="edit-dog-breed">نژاد</FieldLabel>
          <Input
            id="edit-dog-breed"
            list="edit-dog-breed-suggestions"
            autoComplete="off"
            placeholder="مثلاً ژرمن شپرد، یا دورگه"
            aria-invalid={!!errors.breed}
            {...register("breed")}
          />
          <datalist id="edit-dog-breed-suggestions">
            {BREED_SUGGESTIONS.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </datalist>
          <FieldError errors={[errors.breed]} />
        </Field>

        {/*------ Sex ------*/}
        <ChoicePills
          legend="جنس"
          options={DOG_SEXES.map((sex) => ({ value: sex, label: DOG_SEX_LABELS[sex] }))}
          registration={register("sex")}
          error={errors.sex}
        />

        {/*------ Birth Date ------*/}
        <BirthDateField
          register={register}
          control={control}
          errors={errors}
          onApproximateChange={(approximate) => setValue("birthDateApproximate", approximate, { shouldDirty: true })}
        />

        {/* Both fields are locked for the owner once the dog is evaluated; here they stay editable. */}
        {dog.isEvaluated && (
          <p className="-mt-3 text-sm text-pretty text-muted-foreground">
            بعد از ارزیابی فقط تو می‌تونی این دو را عوض کنی؛ صاحبش نمی‌تونه.
          </p>
        )}

        {/*------ Weight ------*/}
        <Field data-invalid={!!errors.weight} className="max-w-56">
          <FieldLabel htmlFor="edit-dog-weight">وزن (کیلو)</FieldLabel>
          <Input
            id="edit-dog-weight"
            inputMode="decimal"
            autoComplete="off"
            placeholder="مثلاً ۱۲٫۵"
            aria-invalid={!!errors.weight}
            {...register("weight")}
          />
          <FieldError errors={[errors.weight]} />
        </Field>

        {/*------ Neutered and Vaccines ------*/}
        <ChoicePills
          legend="عقیم‌شده"
          options={[
            { value: "yes", label: "بله" },
            { value: "no", label: "نه" },
          ]}
          registration={register("isNeutered")}
          error={errors.isNeutered}
        />

        <ChoicePills
          legend="واکسن"
          options={VACCINATION_STATUSES.map((status) => ({
            value: status,
            label: VACCINATION_STATUS_LABELS[status],
          }))}
          registration={register("vaccinationStatus")}
          error={errors.vaccinationStatus}
        />

        {/*------ Microchip ------*/}
        <Field data-invalid={!!errors.microchipNumber}>
          <FieldLabel htmlFor="edit-dog-microchip">میکروچیپ</FieldLabel>
          <Input
            id="edit-dog-microchip"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            className="text-end tabular-nums"
            aria-invalid={!!errors.microchipNumber}
            {...register("microchipNumber")}
          />
          <FieldDescription>فقط عدد، حداکثر ۲۰ رقم.</FieldDescription>
          <FieldError errors={[errors.microchipNumber]} />
        </Field>

        {/*------ Notes ------*/}
        <Field data-invalid={!!errors.behaviorNotes}>
          <FieldLabel htmlFor="edit-dog-behavior">یادداشت رفتاری</FieldLabel>
          <Textarea id="edit-dog-behavior" aria-invalid={!!errors.behaviorNotes} {...register("behaviorNotes")} />
          <FieldError errors={[errors.behaviorNotes]} />
        </Field>

        <Field data-invalid={!!errors.medicalNotes}>
          <FieldLabel htmlFor="edit-dog-medical">یادداشت پزشکی</FieldLabel>
          <Textarea id="edit-dog-medical" aria-invalid={!!errors.medicalNotes} {...register("medicalNotes")} />
          <FieldError errors={[errors.medicalNotes]} />
        </Field>
      </div>

      {/*===== Footer (fixed) =====*/}
      <footer className="flex flex-col gap-3 border-t border-border p-4">
        {/* Directly above the buttons, where the eye is after pressing one. */}
        <FormAlert message={alert || undefined} />

        <div className="flex gap-2">
          <Button type="submit" variant="solid" className="flex-1" disabled={isPending}>
            {isPending && <Spinner aria-hidden />}
            {isPending ? "در حال ذخیره…" : "ذخیره"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            انصراف
          </Button>
        </div>
      </footer>
    </form>
  );
}
