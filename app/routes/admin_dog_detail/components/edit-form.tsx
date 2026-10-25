import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { LockIcon } from "lucide-react";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import type { ApiFailure } from "~/lib/api-error";
import {
  DOG_BREED_PURITIES,
  DOG_BREED_PURITY_LABELS,
  DOG_SEX_LABELS,
  DOG_SEXES,
  VACCINATION_STATUS_LABELS,
  VACCINATION_STATUSES,
} from "~/orpc/dog/constants";
import type { AdminDog } from "~/orpc/dog/contract";
import { BREED_SUGGESTIONS } from "~/routes/admin_dog_detail/breeds";
import { BirthDateField } from "~/routes/admin_dog_detail/components/birth-date-field";
import { ChoicePills } from "~/routes/admin_dog_detail/components/choice-pills";
import { GoalPills } from "~/routes/admin_dog_detail/components/goal-pills";
import { ImplantDateField } from "~/routes/admin_dog_detail/components/implant-date-field";
import {
  BREED_PURITY_UNSET,
  type DogEditInput,
  type DogEditValues,
  dogEditSchema,
  serverFieldToForm,
  toAdminUpdateInput,
  toFormDefaults,
} from "~/routes/admin_dog_detail/schema";
import { INK_OUTLINE, SHEET_FOOTER, SHEET_GROUP } from "~/routes/admin_dog_detail/surfaces";

/*===== Types =====*/
export type DogUpdateInput = ReturnType<typeof toAdminUpdateInput>;

/*===== Edit Form =====*/
/**
 * The dog's details as a form, inside the edit sheet: a scrolling body in five groups split by the tear (who, body, health, training, notes) and a footer with «انصراف» / «ذخیره». The sheet
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
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<DogEditInput, unknown, DogEditValues>({
    resolver: zodResolver(dogEditSchema),
    defaultValues: toFormDefaults(dog),
  });

  const purity = useWatch({ control, name: "breedPurity" });

  /*------ Server Messages ------*/
  // The API validates again; its per-field messages go next to the field. A field the form doesn't have (it shouldn't
  // happen) is added to the alert instead of being lost.
  const orphanMessages: string[] = [];
  useEffect(() => {
    if (!failure) return;
    for (const [field, message] of Object.entries(failure.fields)) {
      const target = serverFieldToForm(field);
      if (target) setError(target, { message });
    }
  }, [failure, setError]);
  for (const [field, message] of Object.entries(failure?.fields ?? {})) {
    if (!serverFieldToForm(field)) orphanMessages.push(message);
  }
  const alert = [failure?.message, ...orphanMessages].filter(Boolean).join(" ");

  const submit = handleSubmit((values) => onSubmit(toAdminUpdateInput({ values, dogId: dog.id })));

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      {/*===== Fields (scrolling) =====*/}
      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/*------ Who ------*/}
        <div className={SHEET_GROUP}>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="edit-dog-name">اسم</FieldLabel>
            <Input id="edit-dog-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>

          {/*------ Breed Type and Breeds ------*/}
          <ChoicePills
            legend="نوع نژاد"
            options={[
              ...DOG_BREED_PURITIES.map((value) => ({ value, label: DOG_BREED_PURITY_LABELS[value] })),
              // An old dog was never asked; the Admin may leave it so.
              { value: BREED_PURITY_UNSET, label: "ثبت نشده" },
            ]}
            registration={register("breedPurity")}
            error={errors.breedPurity}
          />

          {purity === "cross" ? (
            // Two parents, «×» between them. Stacked so each input has the sheet's whole width on a phone.
            <div className="flex flex-col gap-1">
              <BreedInput
                id="edit-dog-breed"
                label="نژاد والد اول"
                // The two parents must differ, and that error sits on the second input.
                registration={register("breed", {
                  onChange: () => errors.breedSecondary && void trigger("breedSecondary"),
                })}
                error={errors.breed}
              />
              <span aria-hidden className="self-center text-xl leading-none text-muted-foreground">
                ×
              </span>
              <BreedInput
                id="edit-dog-breed-secondary"
                label="نژاد والد دوم"
                registration={register("breedSecondary")}
                error={errors.breedSecondary}
              />
            </div>
          ) : (
            <BreedInput
              id="edit-dog-breed"
              label={purity === "mixed" ? "شبیهِ چه نژادی؟ (اختیاری)" : "نژاد"}
              placeholder={purity === "mixed" ? "مثلاً شبیه ژرمن شپرد" : "مثلاً ژرمن شپرد"}
              registration={register("breed")}
              error={errors.breed}
            />
          )}
          <datalist id="edit-dog-breed-suggestions">
            {BREED_SUGGESTIONS.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </datalist>

          <ChoicePills
            legend="جنس"
            options={DOG_SEXES.map((sex) => ({ value: sex, label: DOG_SEX_LABELS[sex] }))}
            registration={register("sex")}
            error={errors.sex}
          />
        </div>

        {/*------ Age and Body ------*/}
        <div className={SHEET_GROUP}>
          <BirthDateField
            register={register}
            control={control}
            errors={errors}
            onApproximateChange={(approximate) => setValue("birthDateApproximate", approximate, { shouldDirty: true })}
          />

          {/* The breed type, breed and birth date lock for the owner once the dog is evaluated; here they stay editable. */}
          {dog.isEvaluated && (
            <p className="-mt-3 flex items-start gap-2 text-sm text-pretty text-muted-foreground">
              <LockIcon aria-hidden strokeWidth={1.8} className="mt-0.5 size-4 shrink-0" />
              نوع نژاد، نژاد و تاریخ تولد بعد از ارزیابی برای صاحبش قفل شده؛ فقط تو می‌تونی عوضشون کنی.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.weight}>
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

            <Field data-invalid={!!errors.height}>
              <FieldLabel htmlFor="edit-dog-height">قد (سانتی‌متر)</FieldLabel>
              <Input
                id="edit-dog-height"
                inputMode="numeric"
                autoComplete="off"
                placeholder="مثلاً ۶۳"
                aria-invalid={!!errors.height}
                {...register("height")}
              />
              <FieldError errors={[errors.height]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.coatColor}>
            <FieldLabel htmlFor="edit-dog-coat">رنگ پوشش</FieldLabel>
            <Input
              id="edit-dog-coat"
              autoComplete="off"
              placeholder="مثلاً مشکی و آتشی"
              aria-invalid={!!errors.coatColor}
              {...register("coatColor")}
            />
            <FieldError errors={[errors.coatColor]} />
          </Field>

          <Field data-invalid={!!errors.markings}>
            <FieldLabel htmlFor="edit-dog-markings">علائم ظاهری</FieldLabel>
            <Textarea
              id="edit-dog-markings"
              className="min-h-20"
              placeholder="مثلاً لکه‌ی سفید روی سینه"
              aria-invalid={!!errors.markings}
              {...register("markings")}
            />
            <FieldError errors={[errors.markings]} />
          </Field>
        </div>

        {/*------ Health ------*/}
        <div className={SHEET_GROUP}>
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

          <Field data-invalid={!!errors.vaccinationNotes}>
            <FieldLabel htmlFor="edit-dog-vaccination-notes">توضیح واکسن‌ها</FieldLabel>
            <Textarea
              id="edit-dog-vaccination-notes"
              className="min-h-20"
              placeholder="مثلاً هاری و پاروو زده، لپتو مونده"
              aria-invalid={!!errors.vaccinationNotes}
              {...register("vaccinationNotes")}
            />
            <FieldError errors={[errors.vaccinationNotes]} />
          </Field>

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

          <ImplantDateField
            register={register}
            control={control}
            errors={errors}
            onPartChange={() => void trigger("implantDay")}
            onClear={() => {
              for (const part of ["implantDay", "implantMonth", "implantYear"] as const) {
                setValue(part, "", { shouldDirty: true });
              }
              clearErrors("implantDay");
            }}
          />
        </div>

        {/*------ Training ------*/}
        <div className={SHEET_GROUP}>
          <GoalPills control={control} error={errors.trainingGoals} />

          <Field data-invalid={!!errors.behaviorProblems}>
            <FieldLabel htmlFor="edit-dog-problems">مشکلات رفتاری</FieldLabel>
            <Textarea
              id="edit-dog-problems"
              placeholder={"هر مشکل توی یه خط، مثلاً:\nپارس زیاد\nگاز گرفتن"}
              aria-invalid={!!errors.behaviorProblems}
              {...register("behaviorProblems")}
            />
            <FieldDescription>هر خط یه مشکله؛ خط خالی و تکراری حساب نمی‌شه.</FieldDescription>
            <FieldError errors={[errors.behaviorProblems]} />
          </Field>
        </div>

        {/*------ Notes ------*/}
        <div className={SHEET_GROUP}>
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
      </div>

      {/*===== Footer (fixed) =====*/}
      <footer className={SHEET_FOOTER}>
        {/* Directly above the buttons, where the eye is after pressing one. */}
        <FormAlert message={alert || undefined} />

        <div className="flex gap-2">
          <Button type="button" variant="outline" className={INK_OUTLINE} onClick={onCancel}>
            انصراف
          </Button>
          <Button type="submit" variant="solid" className="flex-1" disabled={isPending}>
            {isPending && <Spinner aria-hidden />}
            {isPending ? "داره ذخیره می‌شه…" : "ذخیره"}
          </Button>
        </div>
      </footer>
    </form>
  );
}

/*===== Breed Input =====*/
/** One breed input with the shared suggestions list (`edit-dog-breed-suggestions`, rendered once by the form). */
function BreedInput({
  id,
  label,
  placeholder,
  registration,
  error,
}: {
  id: string;
  label: string;
  placeholder?: string;
  registration: ReturnType<ReturnType<typeof useForm<DogEditInput, unknown, DogEditValues>>["register"]>;
  error?: { message?: string };
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        list="edit-dog-breed-suggestions"
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={!!error}
        {...registration}
      />
      <FieldError errors={[error]} />
    </Field>
  );
}
