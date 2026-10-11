import { zodResolver } from "@hookform/resolvers/zod";
import { ORPCError } from "@orpc/client";
import { useMemo, useRef, useState } from "react";
import { type UseFormSetError, useForm, useWatch } from "react-hook-form";
import { useNavigate, useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Link } from "~/components/link";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { MEETING_PLACE_KINDS, MEETING_PLACE_KIND_LABELS } from "~/orpc/assessment/constants";
import type { AvailableSlot } from "~/orpc/assessment/contract";
import { errorDataSchema } from "~/orpc/errors";
import { SegmentedChoice } from "~/routes/account_dog_form/components/segmented-choice";
import { BookingPart } from "~/routes/assessment/components/booking-part";
import { Diary } from "~/routes/assessment/components/diary";
import { DogPicker, NoDogs } from "~/routes/assessment/components/dog-picker";
import { GoalPicker } from "~/routes/assessment/components/goal-picker";
import { PhoneBookingBar } from "~/routes/assessment/components/phone-booking-bar";
import { Slip } from "~/routes/assessment/components/slip";
import type { DogChoice } from "~/routes/assessment/dog-choices";
import { useBookAssessment } from "~/routes/assessment/hooks/use-book-assessment";
import {
  BOOKING_FORM_FIELDS,
  type BookingFormInput,
  type BookingFormValues,
  bookingFormSchema,
  toFormDefaults,
} from "~/routes/assessment/schema";
import { groupSlotsByDay } from "~/routes/assessment/slots";

/** Adding a dog from here brings them back to this page, and the Dog Form adds the new dog's id to the address. */
const NEW_DOG_HREF = `/account/dogs/new?redirectTo=${encodeURIComponent("/assessment")}`;

/*===== Booking Form =====*/
/**
 * The customer's booking sheet: four numbered parts (which dog, what for, what and where, when) beside the slip that
 * fills in as they go. One `<form>`, so the slip's button, the phone bar's button and Enter all submit the same
 * thing. When no dog can book, the parts after the first wait, dimmed.
 */
export function BookingForm({
  choices,
  slots,
  initialDogId,
}: {
  choices: readonly DogChoice[];
  slots: readonly AvailableSlot[];
  initialDogId: string;
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const book = useBookAssessment();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: toFormDefaults({ dogId: initialDogId }),
  });

  const values = useWatch({ control });
  const days = useMemo(() => groupSlotsByDay(slots), [slots]);
  const firstPartRef = useRef<HTMLFieldSetElement>(null);
  const [slotTaken, setSlotTaken] = useState(false);

  const waiting = !choices.some((choice) => choice.availability.kind === "open");
  // Kept busy after success too: the page is on its way to My Assessments, and the button must not invite a second try.
  const busy = book.isPending || book.isSuccess;

  const chosenDog = choices.find((choice) => choice.dog.id === values.dogId)?.dog ?? null;
  const chosenSlot = slots.find((slot) => slot.id === values.slotId) ?? null;

  /*------ Submit ------*/
  const onSubmit = handleSubmit((input) => {
    setSlotTaken(false);
    book.mutate(input, {
      onSuccess: async (assessment) => {
        await navigate(`/account/assessments?booked=${encodeURIComponent(assessment.id)}`, { viewTransition: true });
      },
      onError: (error) =>
        applyBookingError({
          error,
          setError,
          // The server's answer changes what can be booked, so the page reloads its slots and dogs and drops the
          // choice that no longer holds.
          onStale: ({ field }) => {
            setValue(field, "");
            void revalidator.revalidate();
          },
          onSlotTaken: () => setSlotTaken(true),
        }),
    });
  });

  const placeIsHome = values.placeKind !== "meeting-point";

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
          <BookingPart number={1} title="کدام سگ؟" partRef={firstPartRef}>
            {choices.length === 0 ? (
              <NoDogs newDogHref={NEW_DOG_HREF} />
            ) : (
              <>
                {waiting && (
                  <p className="text-pretty text-muted-foreground">
                    سگ‌هایت یا پرونده دارند یا ارزیابی‌شان رزرو شده است. برای سگ تازه می‌توانی یک ارزیابی رایگان رزرو
                    کنی؛ بقیه را از{" "}
                    <Link to="/account/dogs" className="font-bold text-primary underline-offset-4 hover:underline">
                      سگ‌های من
                    </Link>{" "}
                    پیگیری کن.
                  </p>
                )}
                <DogPicker
                  choices={choices}
                  registration={register("dogId")}
                  error={errors.dogId}
                  newDogHref={NEW_DOG_HREF}
                />
              </>
            )}
          </BookingPart>

          {/*------ 2. What For ------*/}
          <BookingPart number={2} title="برای چه می‌خواهی؟" waiting={waiting}>
            <GoalPicker registration={register("trainingGoal")} error={errors.trainingGoal} />
          </BookingPart>

          {/*------ 3. What and Where ------*/}
          <BookingPart
            number={3}
            title="چه چیزی را می‌خواهی عوض شود؟ و کجا ببینمش؟"
            description="فقط آرمان این را می‌بیند."
            waiting={waiting}
          >
            <Field data-invalid={!!errors.customerNote}>
              <FieldLabel htmlFor="assessment-note" className="sr-only">
                چه چیزی را می‌خواهی عوض شود؟
              </FieldLabel>
              <Textarea
                id="assessment-note"
                rows={4}
                placeholder="مثلاً: روی مهمان‌ها می‌پرد و قلاده را می‌کشد"
                aria-invalid={!!errors.customerNote}
                {...register("customerNote")}
              />
              <FieldError errors={[errors.customerNote]} />
            </Field>

            <SegmentedChoice
              legend="کجا ببینمش؟"
              options={MEETING_PLACE_KINDS.map((kind) => ({ value: kind, label: MEETING_PLACE_KIND_LABELS[kind] }))}
              registration={register("placeKind")}
              error={errors.placeKind}
            />

            <Field data-invalid={!!errors.place}>
              <FieldLabel htmlFor="assessment-place">{placeIsHome ? "نشانی" : "کجا؟"}</FieldLabel>
              <Input
                id="assessment-place"
                autoComplete={placeIsHome ? "street-address" : "off"}
                placeholder={placeIsHome ? undefined : "مثلاً پارک ملت، در ورودی شمالی"}
                aria-invalid={!!errors.place}
                {...register("place")}
              />
              {placeIsHome && <FieldDescription>نشانی خانه‌ات را برای آرمان بنویس.</FieldDescription>}
              <FieldError errors={[errors.place]} />
            </Field>
          </BookingPart>
        </div>

        {/*------ 4. When ------*/}
        {/* Outside the narrow column above: the rail wants the column's whole width. */}
        <BookingPart
          number={4}
          title="کی؟"
          description="وقت‌های آزاد آرمان. ساعت‌ها به وقت تهران است."
          waiting={waiting}
        >
          <FormAlert message={slotTaken ? "این وقت همین الان رزرو شد. یک وقت دیگر انتخاب کن." : undefined} />
          <Diary mode="pick" days={days} registration={register("slotId", { onChange: () => setSlotTaken(false) })} />
          <FieldError errors={[errors.slotId]} />
        </BookingPart>
      </div>

      {/*------ Slip ------*/}
      {/* After the form in the DOM, so on phones it sits under the diary, just above the bar's button. */}
      <aside aria-label="برگه‌ی ارزیابی" className="lg:sticky lg:top-8 lg:self-start">
        <Slip
          dog={chosenDog}
          goal={values.trainingGoal ?? null}
          placeKind={values.placeKind ?? null}
          place={values.place ?? ""}
          slot={chosenSlot}
          pending={busy}
          blocked={waiting}
        />
      </aside>

      <PhoneBookingBar firstPartRef={firstPartRef} slot={chosenSlot} pending={busy} blocked={waiting} />
    </form>
  );
}

/*===== Server Errors =====*/
/**
 * Says what the server's answer means for the person, in the form's own places:
 * - `SLOT_TAKEN`: someone booked it first. The diary says so above itself, and the choice goes.
 * - `HAS_RECORD` / `ALREADY_BOOKED`: the dog can't book (the server's message says why); the dog choice goes.
 * - `NOT_FOUND`: the slot or the dog is gone (the API answers the same for both); both are re-chosen.
 * - `INVALID_INPUT`: the server's field messages go next to their fields.
 * `onStale` is for the answers that mean the page's lists are out of date.
 */
function applyBookingError({
  error,
  setError,
  onStale,
  onSlotTaken,
}: {
  error: Error;
  setError: UseFormSetError<BookingFormInput>;
  onStale: (args: { field: "slotId" | "dogId" }) => void;
  onSlotTaken: () => void;
}) {
  const code = error instanceof ORPCError ? error.code : null;
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;
  const [serverMessage] = parsed?.success ? parsed.data.errors : [];

  switch (code) {
    case "SLOT_TAKEN":
      onStale({ field: "slotId" });
      onSlotTaken();
      return;
    case "HAS_RECORD":
    case "ALREADY_BOOKED":
      onStale({ field: "dogId" });
      setError("root", {
        message:
          serverMessage ??
          (code === "HAS_RECORD"
            ? "این سگ پرونده دارد؛ مستقیم برایش دوره رزرو کن."
            : "برای این سگ از قبل یک ارزیابی رزرو شده است."),
      });
      return;
    case "NOT_FOUND":
      onStale({ field: "slotId" });
      setError("root", { message: "این وقت یا این سگ دیگر پیدا نشد. وقت‌ها را تازه کردم؛ دوباره انتخاب کن." });
      return;
    case "INVALID_INPUT": {
      if (!parsed?.success) break;
      for (const [field, message] of Object.entries(parsed.data.fields)) {
        if (BOOKING_FORM_FIELDS.has(field)) setError(field as keyof BookingFormInput, { message });
      }
      if (serverMessage) setError("root", { message: serverMessage });
      return;
    }
    case "UNAUTHORIZED":
    case "FORBIDDEN":
      setError("root", { message: "از حسابت خارج شده‌ای. صفحه را تازه کن و دوباره وارد شو." });
      return;
    case "INTERNAL_SERVER_ERROR": {
      const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
      setError("root", { message: `رزرو نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
      return;
    }
  }
  setError("root", { message: "رزرو نشد. اتصال اینترنتت را بررسی کن و دوباره امتحان کن." });
}
