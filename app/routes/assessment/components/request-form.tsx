import { zodResolver } from "@hookform/resolvers/zod";
import { ORPCError } from "@orpc/client";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch, type UseFormSetError } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { errorDataSchema } from "~/orpc/errors";
import type { Evaluation } from "~/orpc/evaluation/contract";
import { DogPicker, type DogChoice } from "~/routes/assessment/components/dog-picker";
import { EvaluationMediaField } from "~/routes/assessment/components/evaluation-media-field";
import type { GuideProgress } from "~/routes/assessment/components/dog-guide";
import { WhenFreeFields } from "~/routes/assessment/components/when-free-fields";
import { useRequestEvaluation } from "~/routes/assessment/hooks/use-request-evaluation";
import {
  evaluationRequestSchema,
  toFormDefaults,
  toFormField,
  type EvaluationRequestInput,
  type EvaluationRequestValues,
} from "~/routes/assessment/schema";

/*===== Request Form =====*/
/**
 * The evaluation request: which dog, its photos and videos, and when the owner is free. Three plain sections in one
 * raised card. It tells the page how far it has got (`onProgressChange`) so the dog beside it can react, and hands over
 * the saved evaluation (`onSent`) so the page can swap this card for the confirmation.
 */
export function RequestForm({
  dogs,
  defaultDogId,
  onProgressChange,
  onSent,
  onNotRequestable,
}: {
  dogs: readonly DogChoice[];
  /** The dog to start on: the only requestable one, or the one `?dog=` named. Empty when the owner must pick. */
  defaultDogId: string;
  onProgressChange: (progress: GuideProgress) => void;
  onSent: (evaluation: Evaluation) => void;
  /** The server says a dog already has an open request: the page reloads the dogs' states. */
  onNotRequestable: () => void;
}) {
  const requestEvaluation = useRequestEvaluation();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<EvaluationRequestInput, unknown, EvaluationRequestValues>({
    resolver: zodResolver(evaluationRequestSchema),
    defaultValues: toFormDefaults({ dogId: defaultDogId }),
  });
  // True while any file is still uploading: sending then would leave it out without the owner noticing.
  const [busy, setBusy] = useState(false);

  /*------ Progress for the Dog ------*/
  const [dogId, photoMediaIds, videoIds, availableDays, availablePeriods] = useWatch({
    control,
    name: ["dogId", "photoMediaIds", "videoIds", "availableDays", "availablePeriods"],
  });
  const progress: GuideProgress =
    availableDays.length > 0 && availablePeriods.length > 0
      ? 3
      : photoMediaIds.length + videoIds.length > 0
        ? 2
        : dogId
          ? 1
          : 0;
  useEffect(() => onProgressChange(progress), [progress, onProgressChange]);

  /*------ A Dog That Just Became Unavailable ------*/
  // After a conflict the page reloads the dogs' states; a chosen dog that now has a request is let go.
  const chosenUnavailable = dogs.some((dog) => dog.id === dogId && dog.state !== "requestable");
  useEffect(() => {
    if (chosenUnavailable) setValue("dogId", "");
  }, [chosenUnavailable, setValue]);

  /*------ Files ------*/
  const handleFiles = useCallback(
    (value: { photoMediaIds: string[]; videoIds: string[] }) => {
      setValue("photoMediaIds", value.photoMediaIds);
      setValue("videoIds", value.videoIds);
    },
    [setValue],
  );

  /*------ Submit ------*/
  const onSubmit = handleSubmit((values) => {
    requestEvaluation.mutate(values, {
      onSuccess: onSent,
      onError: (error) => {
        applyServerError({ error, setError });
        if (error instanceof ORPCError && error.code === "NOT_REQUESTABLE") onNotRequestable();
      },
    });
  });

  const sending = requestEvaluation.isPending;

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-10 rounded-4xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10"
    >
      <FormAlert message={errors.root?.message} />

      {/*===== Which Dog =====*/}
      <DogPicker dogs={dogs} registration={register("dogId")} error={errors.dogId?.message} />

      {/*===== Photos and Videos =====*/}
      {/* The field is its own section and carries its heading, so it sits here without a wrapper. */}
      <EvaluationMediaField
        onChange={handleFiles}
        onBusyChange={setBusy}
        errors={{ photos: errors.photoMediaIds?.message, videos: errors.videoIds?.message }}
      />

      {/*===== When Free =====*/}
      <section aria-labelledby="when-title" className="min-w-0">
        <h2 id="when-title" className="mb-4 text-lg font-extrabold">
          کی وقت داری؟
        </h2>
        <WhenFreeFields register={register} control={control} setValue={setValue} errors={errors} />
      </section>

      {/*===== Submit =====*/}
      <div className="flex flex-col gap-3 border-t pt-8">
        <Button type="submit" size="lg" disabled={sending || busy} className="w-full sm:w-fit sm:min-w-64">
          {sending && <Spinner />}
          درخواست ارزیابی رایگان
        </Button>
        {busy && <output className="block text-sm text-muted-foreground">تا تموم شدن بارگذاری صبر کن</output>}
        <p className="text-sm text-pretty text-muted-foreground">رایگانه و هیچ تعهدی نداره.</p>
      </div>
    </form>
  );
}

/*===== Server Errors =====*/
/**
 * Puts each failure where the owner will look: a field's message beside the field, a conflict (the dog already has a
 * request) and every other failure in the form-level alert.
 */
function applyServerError({ error, setError }: { error: Error; setError: UseFormSetError<EvaluationRequestInput> }) {
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;
  const code = error instanceof ORPCError ? error.code : null;

  if (code === "INVALID_INPUT" && parsed?.success) {
    for (const [field, message] of Object.entries(parsed.data.fields)) {
      const target = toFormField(field);
      if (target) setError(target, { message });
    }
    const [general] = parsed.data.errors;
    if (general) setError("root", { message: general });
    return;
  }
  if (code === "NOT_REQUESTABLE") {
    const [message] = parsed?.success ? parsed.data.errors : [];
    setError("root", { message: message ?? "این سگ همین حالا یک درخواست باز یا ارزیابی انجام‌شده دارد." });
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
    setError("root", { message: `درخواست ثبت نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
    return;
  }
  setError("root", { message: "درخواست ثبت نشد. اتصال اینترنتت را بررسی کن و دوباره امتحان کن." });
}
