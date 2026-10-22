import { zodResolver } from "@hookform/resolvers/zod";
import { linkOptions, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
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
import { COLUMN } from "~/routes/account_dog_form/column";
import { BirthDateField } from "~/routes/account_dog_form/components/birth-date-field";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import { FormMotion } from "~/routes/account_dog_form/components/form-motion";
import { FormPlate, type PlateGuide } from "~/routes/account_dog_form/components/form-plate";
import { LockedFields } from "~/routes/account_dog_form/components/locked-fields";
import { PrintMount } from "~/routes/account_dog_form/components/print-mount";
import { useDebouncedValue } from "~/routes/account_dog_form/hooks/use-debounced-value";
import { useSaveDog } from "~/routes/account_dog_form/hooks/use-save-dog";
import {
  type DogFormInput,
  type DogFormValues,
  dogFormSchema,
  toDogInput,
  toFormDefaults,
} from "~/routes/account_dog_form/schema";
import { type DogFormSection, firstFieldOf, firstSectionOf } from "~/routes/account_dog_form/sections";
import { applyServerError } from "~/routes/account_dog_form/server-errors";

/*===== The Guide's Words =====*/
// The center's dog looks after each plate and says what it is for, in his first person, about his buddy («رفیقم»).
// Every line is also said in plain words by the plate's description, so the bubbles are for the eyes only.
const trainer = HEAD_TRAINER.firstName;

const IDENTITY_LINES = {
  new: "اسم رفیقمو بنویس تا بشناسمش!",
  edit: "اگه چیزی عوض شده، همین‌جا درستش کن.",
  evaluated: `نژاد و تولدش قفله؛ فقط ${trainer} عوضشون می‌کنه.`,
} as const;
const BODY_LINE = "اینا برای ایمنی جلسه‌هاشه.";
const TRAINER_LINE = `از ترس‌ها و دردهاش بگو؛ ${trainer} قبل از جلسه‌ی اول می‌خونه.`;
/** Said by the dog of the first plate with an error, after a failed submit. */
const ERROR_LINE = "یه جاش جا مونده؛ قرمزها رو ببین.";

/*===== The Guides =====*/
// Each plate's dog and the scenery that means something there: the name card by the hall stand where his leash will
// hang (the padlock once the identity is locked), the scale by the first-aid box, listening by the desk where the head
// trainer reads the notes. Widths stay under about 1.3x each cut-out's natural width.
const GUIDES: Record<"identity" | "locked" | "body" | "trainer", PlateGuide> = {
  identity: {
    dog: "badge",
    dogClassName: "w-[4.75rem] sm:w-28",
    idle: "lively-breathe",
    scenery: "hall-stand",
    sceneryClassName: "-ms-4 w-14 sm:-ms-6 sm:w-28",
  },
  locked: {
    dog: "padlock",
    dogClassName: "w-[4.75rem] sm:w-28",
    idle: "lively-breathe",
    scenery: "hall-stand",
    sceneryClassName: "-ms-4 w-14 sm:-ms-6 sm:w-28",
  },
  body: {
    dog: "scale",
    dogClassName: "w-[5.5rem] sm:w-32",
    idle: "lively-breathe",
    scenery: "first-aid",
    sceneryClassName: "-ms-3 w-14 sm:-ms-5 sm:w-28",
  },
  trainer: {
    dog: "listen",
    dogClassName: "w-[4.25rem] sm:w-24",
    idle: "lively-tilt",
    scenery: "desk",
    sceneryClassName: "-ms-3 w-14 sm:-ms-4 sm:w-28",
  },
};

/*===== Dog Form =====*/
/**
 * The whole body of the page that adds a dog or edits one: the header the page passes in, the print mount (the
 * customer's dog's photo as a taped print that is also the picker, its name stamped as it is typed, its bubble) and the
 * form in three plates, each looked after by the center's dog on its top edge.
 *
 * Saving a new dog goes to the Dashboard and saving an edit to the dog's page, or either goes back to `redirectTo`
 * when another page sent the owner here. Once the dog is evaluated its birth date and breed are locked (app-spec F2):
 * shown, not editable, and submitted as stored.
 *
 * **Who speaks:** one plate's dog at a time. On load it is the identity plate's (the load moment's bubble); focus
 * moving into another plate hands him the word; a failed submit (the form's own check or the server's field errors)
 * gives it to the first plate with an error, who says the error line while the form focuses its first red field.
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
    setFocus,
    setValue,
    formState: { errors },
  } = useForm<DogFormInput, unknown, DogFormValues>({
    resolver: zodResolver(dogFormSchema),
    defaultValues: toFormDefaults(dog),
  });

  /*------ The Print's State ------*/
  const values = useWatch({ control });
  // The form submits only the photo's id; the print needs the uploaded image itself.
  const [photo, setPhoto] = useState<Media | null>(dog?.photo ?? null);
  // Submitting mid-upload would save the dog without the photo that is still on its way.
  const [busy, setBusy] = useState(false);
  // The print's bubble answers a finished name, not every keystroke (the stamped name under it does that).
  const settledName = useDebouncedValue({ value: values.name?.trim() ?? "", delay: 600 });
  const saving = saveDog.isPending || saveDog.isSuccess;
  const printLine = saving
    ? dog
      ? "دارم ذخیره‌ش می‌کنم…"
      : "دارم میام تو!"
    : settledName
      ? `منم ${settledName}!`
      : null;

  /*------ Who Speaks ------*/
  // `key` grows each time a plate takes the word, so that plate's bubble pops again even when it already had it.
  const [speaker, setSpeaker] = useState<{ section: DogFormSection; error: boolean; key: number }>({
    section: "identity",
    error: false,
    key: 0,
  });
  const focusSection = (section: DogFormSection) =>
    // Staying inside the same plate keeps its words (an error line stays while its red fields are being fixed).
    setSpeaker((current) => (current.section === section ? current : { section, error: false, key: current.key + 1 }));
  const speakError = (fields: readonly string[]) => {
    const section = firstSectionOf(fields);
    if (section) setSpeaker((current) => ({ section, error: true, key: current.key + 1 }));
  };
  const plateVoice = (section: DogFormSection, line: string) => ({
    line: speaker.section === section && speaker.error ? ERROR_LINE : line,
    speaking: speaker.section === section,
    speakerKey: speaker.key,
    firstLoad: speaker.key === 0,
    onFocusSection: focusSection,
  });

  /*------ Submit ------*/
  const onSubmit = handleSubmit(
    (submitted) => {
      saveDog.mutate(toDogInput({ values: submitted, dog }), {
        onSuccess: async (saved) => {
          toast.add({ title: dog ? "تغییرات ذخیره شد." : `${saved.name} اضافه شد.`, type: "success" });
          // A new dog goes back with its id (`?dog=`), so the page that sent them here can preselect it. `redirectTo` is
          // any same-site path, so it goes in `href`, which the router parses.
          if (redirectTo) {
            const href = dog ? redirectTo : withDogParam({ redirectTo, dogId: saved.id });
            await navigate({ href, viewTransition: true });
            return;
          }
          // Without a `redirectTo`, a new dog goes to the Dashboard (where it now appears), an edit to the dog's page.
          await (dog
            ? navigate({ to: "/account/dogs/$dogId", params: { dogId: saved.id }, viewTransition: true })
            : navigate({ to: "/account", viewTransition: true }));
        },
        onError: (error) => {
          const fields = applyServerError({ error, setError });
          speakError(fields);
          // The person is at the button: take them to the server's first red field, as the form's own check does.
          const first = firstFieldOf(fields);
          if (first) setFocus(first);
        },
      });
    },
    // Called before the form focuses the first invalid field, whose focus then lands in the same plate.
    (invalid) => speakError(Object.keys(invalid)),
  );

  const identityLine = !dog ? IDENTITY_LINES.new : locked ? IDENTITY_LINES.evaluated : IDENTITY_LINES.edit;

  return (
    <div className="overflow-x-clip">
      <FormMotion />

      <div
        className={cn(
          COLUMN,
          "grid grid-cols-[minmax(0,1fr)] pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12 lg:pt-12 xl:gap-x-16",
        )}
      >
        {/*===== Header =====*/}
        {/* Room under it for the first plate's bubble, which grows upwards when its line takes two lines. */}
        <div className="pb-6 lg:col-start-1 lg:row-start-1 lg:pb-8">{header}</div>

        {/*===== Print Mount =====*/}
        {/* Second in the document so phones see the dog between the heading and the form; desktop puts it at the end. */}
        <PrintMount
          values={values}
          bubbleLine={printLine}
          photo={photo}
          onPhotoChange={(media) => {
            setPhoto(media);
            setValue("photoMediaId", media?.id ?? null, { shouldDirty: true });
          }}
          onBusyChange={setBusy}
          photoError={errors.photoMediaId?.message}
          className="mb-12 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-2 lg:mb-0 lg:self-start"
        />

        {/*===== Form =====*/}
        <form
          method="post"
          onSubmit={onSubmit}
          noValidate
          className="flex min-w-0 flex-col gap-14 lg:col-start-1 lg:row-start-2"
        >
          {/*------ Identity ------*/}
          <FormPlate
            id="identity"
            title="شناسنامه"
            description={`${trainer} با همینا سگت رو می‌شناسه.`}
            guide={locked ? GUIDES.locked : GUIDES.identity}
            {...plateVoice("identity", identityLine)}
          >
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="dog-name">اسم</FieldLabel>
              <Input id="dog-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
              <FieldError key={errors.name?.message} errors={[errors.name]} className="answer-in" />
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
                  <FieldError key={errors.breed?.message} errors={[errors.breed]} className="answer-in" />
                </Field>

                <BirthDateField register={register} control={control} errors={errors} />
              </>
            )}
          </FormPlate>

          {/*------ Body and Health ------*/}
          <FormPlate
            id="body"
            title="بدن و سلامت"
            description="برای برنامه‌ی تمرین و ایمنی جلسه‌ها."
            guide={GUIDES.body}
            {...plateVoice("body", BODY_LINE)}
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
              <FieldError key={errors.weight?.message} errors={[errors.weight]} className="answer-in" />
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
                شماره‌ی میکروچیپ <span className="font-medium text-muted-foreground">(اختیاری)</span>
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
              <FieldDescription>روی کارت واکسن یا مدارک دامپزشک نوشته شده.</FieldDescription>
              <FieldError
                key={errors.microchipNumber?.message}
                errors={[errors.microchipNumber]}
                className="answer-in"
              />
            </Field>
          </FormPlate>

          {/*------ For the Trainer ------*/}
          <FormPlate
            id="trainer"
            title={`برای ${trainer}`}
            description={`اینا رو فقط ${trainer} می‌خونه، قبل از اولین جلسه.`}
            guide={GUIDES.trainer}
            {...plateVoice("trainer", TRAINER_LINE)}
          >
            <Field data-invalid={!!errors.behaviorNotes}>
              <FieldLabel htmlFor="dog-behavior">رفتارش</FieldLabel>
              <Textarea
                id="dog-behavior"
                placeholder="مثلاً: از سگ‌های بزرگ می‌ترسه، روی مهمون می‌پره"
                aria-invalid={!!errors.behaviorNotes}
                {...register("behaviorNotes")}
              />
              <FieldError key={errors.behaviorNotes?.message} errors={[errors.behaviorNotes]} className="answer-in" />
            </Field>

            <Field data-invalid={!!errors.medicalNotes}>
              <FieldLabel htmlFor="dog-medical">سلامتش</FieldLabel>
              <Textarea
                id="dog-medical"
                placeholder="مثلاً: حساسیت غذایی، درد مفصل، داروی روزانه"
                aria-invalid={!!errors.medicalNotes}
                {...register("medicalNotes")}
              />
              <FieldError key={errors.medicalNotes?.message} errors={[errors.medicalNotes]} className="answer-in" />
            </Field>
          </FormPlate>

          {/*------ Actions ------*/}
          <div className="-mt-4 flex flex-col gap-4">
            {/* Directly above the buttons, where the eye is after pressing one; keyed so a new message rises in. */}
            {errors.root?.message && (
              <div key={errors.root.message} className="answer-in">
                <FormAlert message={errors.root.message} />
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                variant="solid"
                size="lg"
                className="w-full sm:w-auto sm:min-w-48"
                disabled={saveDog.isPending || busy}
              >
                {saveDog.isPending && <Spinner data-icon="inline-start" />}
                {saveDog.isPending ? (dog ? "در حال ذخیره…" : "در حال اضافه کردن…") : dog ? "ذخیره" : "اضافه کن"}
              </Button>
              {/* Back where they came from: `redirectTo` (a built path, so `href`, which the router parses; `to` is only
                  there for the types), else the dog's page or the list. */}
              <Link
                {...(redirectTo
                  ? linkOptions({ to: ".", href: redirectTo })
                  : dog
                    ? linkOptions({ to: "/account/dogs/$dogId", params: { dogId: dog.id } })
                    : linkOptions({ to: "/account" }))}
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                انصراف
              </Link>
            </div>

            {busy && (
              <output className="answer-in block text-sm text-muted-foreground">تا تموم شدن بارگذاری صبر کن</output>
            )}

            {/*------ The Path ------*/}
            {/* The form ends on a short stretch of path, a bush at each end; physical sides, a picture. */}
            <div aria-hidden className="pointer-events-none relative mt-2 h-16 sm:h-20">
              <GroundStrip className="absolute inset-x-0 bottom-0 h-8 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:h-10" />
              <MascotCut name="plants" className="lively-sway absolute right-[3%] bottom-4 w-12 -scale-x-100 sm:w-16" />
              <MascotCut name="plants" className="lively-sway-2 absolute bottom-4 left-[3%] w-10 sm:w-14" />
            </div>
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
