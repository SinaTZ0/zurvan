import { zodResolver } from "@hookform/resolvers/zod";
import { ORPCError } from "@orpc/client";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import { describeApiFailure } from "~/lib/api-error";
import { formatNumberFa } from "~/lib/digits";
import { BEHAVIOR_DESCRIPTION_MAX_LENGTH } from "~/orpc/behavior-request/constants";
import { Input } from "~/components/ui/input";
import { ProblemPicker } from "~/routes/behavior_modification/components/problem-picker";
import { RequestDogPicker, NoDogs, AllBlocked } from "~/routes/behavior_modification/components/request-dog-picker";
import { RequestPart } from "~/routes/behavior_modification/components/request-part";
import { PhoneRequestBar } from "~/routes/behavior_modification/components/phone-request-bar";
import { RequestSlip } from "~/routes/behavior_modification/components/request-slip";
import { VideoUploader } from "~/routes/behavior_modification/components/video-uploader";
import type { RequestDogChoice } from "~/routes/behavior_modification/dog-choices";
import { useSubmitBehaviorRequest } from "~/routes/behavior_modification/hooks/use-submit-behavior-request";
import { useVideoUpload } from "~/routes/behavior_modification/hooks/use-video-upload";
import {
  REQUEST_FORM_FIELDS,
  type RequestFormInput,
  type RequestFormValues,
  requestFormSchema,
  toRequestFormDefaults,
} from "~/routes/behavior_modification/schema";

/** Adding a dog from here brings them back to this page, and the Dog Form adds the new dog's id to the address. */
const NEW_DOG_HREF = `/account/dogs/new?redirectTo=${encodeURIComponent("/behavior-modification")}`;

/*===== Request Form =====*/
/**
 * The customer's request sheet: four numbered parts (which dog, what the problem is, the videos, where and when) beside
 * the slip that fills in as they go. One `<form>`, so the slip's button, the phone bar's button and Enter all submit the
 * same thing. With no dog able to start a request, the parts after the first wait, dimmed.
 */
export function RequestForm({ dogs, initialDogId }: { dogs: readonly RequestDogChoice[]; initialDogId: string }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const submit = useSubmitBehaviorRequest();
  const videos = useVideoUpload();
  const [videoError, setVideoError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<RequestFormInput, unknown, RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    // Errors show once a field has been left, and again on every submit, so a fixed field clears at once.
    mode: "onTouched",
    defaultValues: toRequestFormDefaults({ dogId: initialDogId }),
  });

  const values = useWatch({ control });
  const firstPartRef = useRef<HTMLFieldSetElement>(null);

  const waiting = !dogs.some((choice) => !choice.blocked);
  // Kept busy after success too: the page is on its way to My Behavior Requests, and the button must not invite a second send.
  const busy = submit.isPending || submit.isSuccess;
  const uploading = videos.uploading;

  const chosenDog = dogs.find((choice) => choice.dog.id === values.dogId)?.dog ?? null;
  const description = values.description ?? "";
  const ready =
    !!chosenDog &&
    !!values.problemCategory &&
    description.trim().length > 0 &&
    (values.address ?? "").trim().length > 0 &&
    (values.preferredTimes ?? "").trim().length > 0 &&
    videos.uploadedIds.length > 0 &&
    !uploading;

  /*------ Submit ------*/
  const onSubmit = handleSubmit((input) => {
    // Enter in a field can submit while the button is disabled, so the videos are checked here too.
    if (uploading) {
      setVideoError("ویدیو هنوز در حال بارگذاری است. صبر کن تمام شود.");
      return;
    }
    if (videos.uploadedIds.length === 0) {
      setVideoError("دست‌کم یک ویدیو از رفتار سگ بفرست.");
      return;
    }
    setVideoError(null);

    submit.mutate(
      { ...input, videoIds: videos.uploadedIds },
      {
        onSuccess: async (result) => {
          await navigate(`/account/behavior-requests?sent=${encodeURIComponent(result.id)}`, { viewTransition: true });
        },
        onError: (error) => {
          const code = error instanceof ORPCError ? error.code : null;
          const failure = describeApiFailure({ error, fallback: "درخواست نرفت. دوباره امتحان کن." });

          for (const [field, message] of Object.entries(failure.fields)) {
            if (field === "videoIds" || field === "videos") setVideoError(message);
            else if (REQUEST_FORM_FIELDS.has(field)) setError(field as keyof RequestFormInput, { message });
          }
          if (failure.message) setError("root", { message: failure.message });

          // The answer changes which dogs can send a request: the dog choice goes, and the list is read again.
          if (code === "NOT_ELIGIBLE" || code === "NOT_FOUND") {
            setValue("dogId", "");
            void revalidator.revalidate();
          }
        },
      },
    );
  });

  const videoCount = videos.uploadedIds.length;
  const summary = chosenDog ? `سگ: ${chosenDog.name}` : "هنوز سگی انتخاب نکرده‌ای";

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      className="site-container grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 pt-10 pb-28 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-20 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
    >
      <div className="flex min-w-0 flex-col gap-12">
        <FormAlert message={errors.root?.message} />

        <div className="flex max-w-[44rem] min-w-0 flex-col gap-12">
          {/*------ 1. Which Dog ------*/}
          <RequestPart number={1} title="کدام سگ؟" partRef={firstPartRef}>
            {dogs.length === 0 ? (
              <NoDogs newDogHref={NEW_DOG_HREF} />
            ) : (
              <>
                {waiting && <AllBlocked />}
                <RequestDogPicker
                  dogs={dogs}
                  registration={register("dogId")}
                  error={errors.dogId}
                  newDogHref={NEW_DOG_HREF}
                />
              </>
            )}
          </RequestPart>

          {/*------ 2. What Problem ------*/}
          <RequestPart
            number={2}
            title="مشکل چیست؟"
            description="یکی را انتخاب کن و بعد بنویس. آرمان فقط برای این کار را می‌بیند."
            waiting={waiting}
          >
            <ProblemPicker registration={register("problemCategory")} error={errors.problemCategory} />

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="behavior-description">
                از کی شروع شده؟ چه وقت‌هایی بدتر می‌شود؟ قبلاً چه کار کرده‌ای؟
              </FieldLabel>
              <Textarea
                id="behavior-description"
                rows={5}
                aria-invalid={!!errors.description}
                {...register("description")}
              />
              <FieldDescription>
                حداکثر {formatNumberFa(BEHAVIOR_DESCRIPTION_MAX_LENGTH)} حرف. الان {formatNumberFa(description.length)}{" "}
                حرف نوشته‌ای.
              </FieldDescription>
              <FieldError errors={[errors.description]} />
            </Field>
          </RequestPart>

          {/*------ 3. Videos ------*/}
          <RequestPart number={3} title="ویدیو" waiting={waiting}>
            <VideoUploader tiles={videos.tiles} onAdd={videos.add} onRemove={videos.remove} error={videoError} />
          </RequestPart>

          {/*------ 4. Where and When ------*/}
          <RequestPart number={4} title="کجا و کی؟" waiting={waiting}>
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="behavior-address">نشانی محل جلسه‌ها</FieldLabel>
              <Input
                id="behavior-address"
                autoComplete="street-address"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldDescription>جلسه‌ها در خانه‌ی تو یا محلی که بنویسی برگزار می‌شود.</FieldDescription>
              <FieldError errors={[errors.address]} />
            </Field>

            <Field data-invalid={!!errors.preferredTimes}>
              <FieldLabel htmlFor="behavior-times">چه روزها و ساعت‌هایی برایت مناسب است؟</FieldLabel>
              <Textarea
                id="behavior-times"
                rows={3}
                placeholder="مثلاً: شنبه‌ها بعد از ظهر، یا عصرهای سه‌شنبه"
                aria-invalid={!!errors.preferredTimes}
                {...register("preferredTimes")}
              />
              <FieldError errors={[errors.preferredTimes]} />
            </Field>
          </RequestPart>
        </div>
      </div>

      {/*------ Slip ------*/}
      {/* After the form in the DOM, so on phones it sits above the bar and never under its button. */}
      <aside aria-label="برگه‌ی درخواست" className="lg:sticky lg:top-8 lg:self-start">
        <RequestSlip
          dog={chosenDog}
          problem={values.problemCategory ?? null}
          videoCount={videoCount}
          description={description}
          pending={busy}
          uploading={uploading}
          disabled={busy || !ready}
        />
      </aside>

      <PhoneRequestBar
        firstPartRef={firstPartRef}
        summary={summary}
        pending={busy}
        uploading={uploading}
        disabled={busy || !ready}
      />
    </form>
  );
}
