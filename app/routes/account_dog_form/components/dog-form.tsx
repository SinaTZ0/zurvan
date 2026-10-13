import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { DOG_SEX_LABELS, DOG_SEXES, VACCINATION_STATUS_LABELS, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import type { Media } from "~/orpc/media/contract";
import { BREED_SUGGESTIONS } from "~/routes/account_dog_form/breeds";
import { BirthDateField } from "~/routes/account_dog_form/components/birth-date-field";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import { DogCard } from "~/routes/account_dog_form/components/dog-card";
import { FormSection } from "~/routes/account_dog_form/components/form-section";
import { LockedFields } from "~/routes/account_dog_form/components/locked-fields";
import { useSaveDog } from "~/routes/account_dog_form/hooks/use-save-dog";
import {
  type DogFormInput,
  type DogFormValues,
  dogFormSchema,
  toDogInput,
  toFormDefaults,
} from "~/routes/account_dog_form/schema";
import type { DogFormSection } from "~/routes/account_dog_form/sections";
import { applyServerError } from "~/routes/account_dog_form/server-errors";

/*===== Dog Form =====*/
/**
 * The whole body of the page that adds a dog or edits one: the header the page passes in, the dog's card (its photo,
 * its name stamped as it is typed, a bubble that follows the section) and the form in three short sections.
 *
 * Saving a new dog goes to the Dashboard and saving an edit to the dog's page, or either goes back to `redirectTo`
 * when another page sent the owner here. Once the dog is evaluated its birth date and breed are locked (app-spec F2):
 * shown, not editable, and submitted as stored.
 */
export function DogForm({
  dog,
  redirectTo,
  header,
}: {
  dog: Dog | null;
  redirectTo: string | null;
  header: React.ReactNode;
}) {
  const navigate = useNavigate();
  const saveDog = useSaveDog({ dogId: dog?.id ?? null });
  const locked = dog?.isEvaluated === true;
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

  /*------ The Dog Card's State ------*/
  const values = useWatch({ control });
  // The form submits only the photo's id; the card needs the uploaded image itself.
  const [photo, setPhoto] = useState<Media | null>(dog?.photo ?? null);
  // Submitting mid-upload would save the dog without the photo that is still on its way.
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<DogFormSection>("identity");

  /*------ Submit ------*/
  const onSubmit = handleSubmit((submitted) => {
    saveDog.mutate(toDogInput({ values: submitted, dog }), {
      onSuccess: async (saved) => {
        toast.add({ title: dog ? "تغییرات ذخیره شد." : `${saved.name} اضافه شد.`, type: "success" });
        // A new dog goes back with its id (`?dog=`), so the page that sent them here can preselect it.
        const destination = redirectTo ? (dog ? redirectTo : withDogParam({ redirectTo, dogId: saved.id })) : null;
        // Without a `redirectTo`, a new dog goes to the Dashboard (where it now appears), an edit to the dog's page.
        await navigate(destination ?? (dog ? `/account/dogs/${saved.id}` : "/account"), { viewTransition: true });
      },
      onError: (error) => applyServerError({ error, setError }),
    });
  });

  const cancelTo = redirectTo ?? (dog ? `/account/dogs/${dog.id}` : "/account");
  const trainer = HEAD_TRAINER.firstName;

  return (
    <div className="site-container py-8 lg:py-14">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
        {/*===== Header =====*/}
        <div className="pb-8 lg:col-start-1 lg:row-start-1 lg:pb-10">{header}</div>

        {/*===== Dog Card =====*/}
        {/* Second in the document so phones see the dog between the heading and the form; desktop puts it at the end. */}
        <DogCard
          values={values}
          photo={photo}
          onPhotoChange={(media) => {
            setPhoto(media);
            setValue("photoMediaId", media?.id ?? null, { shouldDirty: true });
          }}
          onBusyChange={setBusy}
          photoError={errors.photoMediaId?.message}
          section={section}
          isEdit={dog !== null}
          isEvaluated={locked}
          className="mb-10 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mb-0 lg:self-start"
        />

        {/*===== Form =====*/}
        <form
          method="post"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-12 lg:col-start-1 lg:row-start-2"
        >
          {/*------ Identity ------*/}
          <FormSection
            id="identity"
            title="شناسنامه"
            description={`${trainer} با همین‌ها سگت را می‌شناسد.`}
            onFocusSection={setSection}
          >
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="dog-name">اسم</FieldLabel>
              <Input id="dog-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>

            <ChoicePills
              legend="جنس"
              options={DOG_SEXES.map((sex) => ({ value: sex, label: DOG_SEX_LABELS[sex] }))}
              registration={register("sex")}
              error={errors.sex}
            />

            {/* Locked: the breed and the birth date sit together as two plates. The server's error for a locked
                birth date (`birthDate` maps to `birthDay`) shows under its plate. */}
            {locked ? (
              <LockedFields dog={dog} breedError={errors.breed} birthError={errors.birthDay ?? errors.ageYears} />
            ) : (
              <>
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

                <BirthDateField register={register} control={control} errors={errors} />
              </>
            )}
          </FormSection>

          {/*------ Body and Health ------*/}
          <FormSection
            id="body"
            title="بدن و سلامت"
            description="برای برنامه‌ی تمرین و ایمنی جلسه‌ها."
            onFocusSection={setSection}
          >
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

            <ChoicePills
              legend="عقیم شده؟"
              options={[
                { value: "yes", label: "بله" },
                { value: "no", label: "نه" },
              ]}
              registration={register("isNeutered")}
              error={errors.isNeutered}
            />

            <ChoicePills
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
          <FormSection
            id="trainer"
            title="برای مربی"
            description={`این دو را فقط ${trainer} و مربی سگت می‌بینند، قبل از اولین جلسه.`}
            onFocusSection={setSection}
          >
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
          <div className="flex flex-col gap-4">
            {/* Directly above the buttons, where the eye is after pressing one. */}
            <FormAlert message={errors.root?.message} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto sm:min-w-44"
                disabled={saveDog.isPending || busy}
              >
                {saveDog.isPending && <Spinner data-icon="inline-start" />}
                {saveDog.isPending ? (dog ? "در حال ذخیره…" : "در حال اضافه کردن…") : dog ? "ذخیره" : "اضافه کن"}
              </Button>
              <Link to={cancelTo} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                انصراف
              </Link>
            </div>

            {busy && <output className="block text-sm text-muted-foreground">تا تموم شدن بارگذاری صبر کن</output>}
          </div>
        </form>
      </div>
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
