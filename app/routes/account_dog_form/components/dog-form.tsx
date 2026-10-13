import { zodResolver } from "@hookform/resolvers/zod";
import { ORPCError } from "@orpc/client";
import { useState } from "react";
import { useForm, useWatch, type UseFormSetError } from "react-hook-form";
import { useNavigate } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { Link } from "~/components/link";
import { DOG_SEX_LABELS, DOG_SEXES, VACCINATION_STATUS_LABELS, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { errorDataSchema } from "~/orpc/errors";
import type { Media } from "~/orpc/media/contract";
import { BREED_SUGGESTIONS } from "~/routes/account_dog_form/breeds";
import { BirthDateField } from "~/routes/account_dog_form/components/birth-date-field";
import { DogPreview } from "~/routes/account_dog_form/components/dog-preview";
import { FormSection } from "~/routes/account_dog_form/components/form-section";
import { PhotoPicker } from "~/routes/account_dog_form/components/photo-picker";
import { SegmentedChoice } from "~/components/segmented-choice";
import { useSaveDog } from "~/routes/account_dog_form/hooks/use-save-dog";
import {
  type DogFormInput,
  type DogFormValues,
  dogFormSchema,
  SERVER_FIELD_TO_FORM,
  toDogInput,
  toFormDefaults,
} from "~/routes/account_dog_form/schema";

/*===== Dog Form =====*/
/**
 * Adds a dog, or edits one. Three short sections (who it is, its body and health, notes for the trainer) beside a live
 * preview of the dog's tag. Saving goes to the dog's page, or back to `redirectTo` when another page sent them here.
 */
export function DogForm({ dog, redirectTo }: { dog: Dog | null; redirectTo: string | null }) {
  const navigate = useNavigate();
  const saveDog = useSaveDog({ dogId: dog?.id ?? null });
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<DogFormInput, unknown, DogFormValues>({
    resolver: zodResolver(dogFormSchema),
    defaultValues: toFormDefaults(dog),
  });

  /*------ Live Preview ------*/
  const preview = useWatch({ control });
  // The form submits only the photo's id; the preview needs the uploaded image itself.
  const [photo, setPhoto] = useState<Media | null>(dog?.photo ?? null);

  /*------ Submit ------*/
  const onSubmit = handleSubmit((values) => {
    saveDog.mutate(toDogInput(values), {
      onSuccess: async (saved) => {
        toast.add({ title: dog ? "تغییرات ذخیره شد." : `${saved.name} اضافه شد.`, type: "success" });
        // A new dog goes back with its id (`?dog=`), so the page that sent them here can preselect it.
        const destination = redirectTo ? (dog ? redirectTo : withDogParam({ redirectTo, dogId: saved.id })) : null;
        await navigate(destination ?? `/account/dogs/${saved.id}`, { viewTransition: true });
      },
      onError: (error) => applyServerError({ error, setError }),
    });
  });

  const cancelTo = redirectTo ?? (dog ? `/account/dogs/${dog.id}` : "/account/dogs");

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-16">
      {/*===== Preview =====*/}
      {/* First in the DOM so phones see the dog's tag above the form; on desktop it is the end column. */}
      <aside aria-label="پیش‌نمایش" className="lg:sticky lg:top-8 lg:order-last lg:col-span-5 lg:self-start">
        <DogPreview values={preview} photo={photo} />
      </aside>

      {/*===== Form =====*/}
      <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-12 lg:col-span-7">
        <FormAlert message={errors.root?.message} />

        {/*------ Identity ------*/}
        <FormSection title="شناسنامه" description="آرمان با همین‌ها سگت را می‌شناسد.">
          <PhotoPicker
            media={photo}
            onChange={(media) => {
              setPhoto(media);
              setValue("photoMediaId", media?.id ?? null, { shouldDirty: true });
            }}
            error={errors.photoMediaId?.message}
          />

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="dog-name">اسم</FieldLabel>
            <Input id="dog-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.breed}>
            <FieldLabel htmlFor="dog-breed">نژاد</FieldLabel>
            <Input
              id="dog-breed"
              list="dog-breed-suggestions"
              autoComplete="off"
              placeholder="مثلاً ژرمن شپرد، یا دورگه"
              aria-invalid={!!errors.breed}
              {...register("breed")}
            />
            <datalist id="dog-breed-suggestions">
              {BREED_SUGGESTIONS.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </datalist>
            <FieldError errors={[errors.breed]} />
          </Field>

          <SegmentedChoice
            legend="جنس"
            options={DOG_SEXES.map((sex) => ({ value: sex, label: DOG_SEX_LABELS[sex] }))}
            registration={register("sex")}
            error={errors.sex}
          />

          <BirthDateField register={register} control={control} errors={errors} />
        </FormSection>

        {/*------ Body and Health ------*/}
        <FormSection title="بدن و سلامت" description="برای برنامه‌ی تمرین و ایمنی جلسه‌ها.">
          <Field data-invalid={!!errors.weight} className="max-w-56">
            <FieldLabel htmlFor="dog-weight">وزن (کیلو)</FieldLabel>
            <Input
              id="dog-weight"
              inputMode="decimal"
              autoComplete="off"
              placeholder="مثلاً ۱۲٫۵"
              aria-invalid={!!errors.weight}
              {...register("weight")}
            />
            <FieldError errors={[errors.weight]} />
          </Field>

          <SegmentedChoice
            legend="عقیم شده؟"
            options={[
              { value: "yes", label: "بله" },
              { value: "no", label: "نه" },
            ]}
            registration={register("isNeutered")}
            error={errors.isNeutered}
          />

          <SegmentedChoice
            legend="واکسن‌ها"
            options={VACCINATION_STATUSES.map((status) => ({
              value: status,
              label: VACCINATION_STATUS_LABELS[status],
            }))}
            registration={register("vaccinationStatus")}
            error={errors.vaccinationStatus}
          />

          <Field data-invalid={!!errors.microchipNumber}>
            <FieldLabel htmlFor="dog-microchip">
              شماره میکروچیپ <span className="font-medium text-muted-foreground">(اختیاری)</span>
            </FieldLabel>
            <Input
              id="dog-microchip"
              dir="ltr"
              inputMode="numeric"
              autoComplete="off"
              className="text-end tabular-nums"
              aria-invalid={!!errors.microchipNumber}
              {...register("microchipNumber")}
            />
            <FieldDescription>روی کارت واکسن یا مدارک دامپزشک نوشته شده است.</FieldDescription>
            <FieldError errors={[errors.microchipNumber]} />
          </Field>
        </FormSection>

        {/*------ For the Trainer ------*/}
        <FormSection title="برای مربی" description="این دو را فقط آرمان و مربی سگت می‌بینند، قبل از اولین جلسه.">
          <Field data-invalid={!!errors.behaviorNotes}>
            <FieldLabel htmlFor="dog-behavior">رفتارش</FieldLabel>
            <Textarea
              id="dog-behavior"
              placeholder="مثلاً: از سگ‌های بزرگ می‌ترسد، روی مهمان می‌پرد"
              aria-invalid={!!errors.behaviorNotes}
              {...register("behaviorNotes")}
            />
            <FieldError errors={[errors.behaviorNotes]} />
          </Field>

          <Field data-invalid={!!errors.medicalNotes}>
            <FieldLabel htmlFor="dog-medical">سلامتش</FieldLabel>
            <Textarea
              id="dog-medical"
              placeholder="مثلاً: حساسیت غذایی، درد مفصل، داروی روزانه"
              aria-invalid={!!errors.medicalNotes}
              {...register("medicalNotes")}
            />
            <FieldError errors={[errors.medicalNotes]} />
          </Field>
        </FormSection>

        {/*------ Actions ------*/}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-44" disabled={saveDog.isPending}>
            {saveDog.isPending && <Spinner data-icon="inline-start" />}
            {dog ? "ذخیره" : "اضافه کن"}
          </Button>
          <Link
            to={cancelTo}
            className="flex h-14 items-center justify-center rounded-lg px-5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            انصراف
          </Link>
        </div>
      </form>
    </div>
  );
}

/*===== Redirect =====*/
/** `redirectTo` with `dog=<id>` added to its query; any query it already has is kept. `redirectTo` is a same-site path. */
function withDogParam({ redirectTo, dogId }: { redirectTo: string; dogId: string }) {
  const url = new URL(redirectTo, "http://localhost");
  url.searchParams.set("dog", dogId);
  return `${url.pathname}${url.search}${url.hash}`;
}

/*===== Server Errors =====*/
const FORM_FIELDS = new Set<string>([
  "photoMediaId",
  "name",
  "breed",
  "sex",
  "isNeutered",
  "vaccinationStatus",
  "microchipNumber",
  "behaviorNotes",
  "medicalNotes",
]);

/**
 * Puts the server's messages next to their fields, and anything else in the form-level alert. The two procedures
 * share one mutation, so its error isn't typed per procedure; the shared error shape is checked here instead.
 */
function applyServerError({ error, setError }: { error: Error; setError: UseFormSetError<DogFormInput> }) {
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;
  const code = error instanceof ORPCError ? error.code : null;

  if (code === "INVALID_INPUT" && parsed?.success) {
    for (const [field, message] of Object.entries(parsed.data.fields)) {
      const target = SERVER_FIELD_TO_FORM[field] ?? (FORM_FIELDS.has(field) ? (field as keyof DogFormInput) : null);
      if (target) setError(target, { message });
    }
    const [general] = parsed.data.errors;
    if (general) setError("root", { message: general });
    return;
  }
  if (code === "UNAUTHORIZED") {
    setError("root", { message: "از حسابت خارج شده‌ای. صفحه را تازه کن و دوباره وارد شو." });
    return;
  }
  if (code === "NOT_FOUND") {
    setError("root", { message: "این سگ دیگر در حسابت نیست." });
    return;
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
    setError("root", { message: `ذخیره نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
    return;
  }
  setError("root", { message: "ذخیره نشد. اتصال اینترنتت را بررسی کن و دوباره امتحان کن." });
}
