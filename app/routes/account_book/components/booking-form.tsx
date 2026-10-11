import { zodResolver } from "@hookform/resolvers/zod";
import { ORPCError } from "@orpc/client";
import { useMemo, useRef } from "react";
import { type UseFormSetError, useForm, useWatch } from "react-hook-form";
import { useNavigate, useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { describeApiFailure } from "~/lib/api-error";
import { errorDataSchema } from "~/orpc/errors";
import type { BookingOptions } from "~/orpc/order/contract";
import { BookingPart } from "~/routes/assessment/components/booking-part";
import { GoalPicker } from "~/routes/assessment/components/goal-picker";
import { BookingReceipt } from "~/routes/account_book/components/booking-receipt";
import { DogPicker, NoDogs } from "~/routes/account_book/components/dog-picker";
import { PhoneBookingBar } from "~/routes/account_book/components/phone-booking-bar";
import { PlaceChoice } from "~/routes/account_book/components/place-choice";
import { RetakeNotice } from "~/routes/account_book/components/retake-notice";
import { useBookCourse } from "~/routes/account_book/hooks/use-book-course";
import {
  type BookingFormInput,
  type BookingFormValues,
  createBookingFormSchema,
  toFormDefaults,
  toFormField,
} from "~/routes/account_book/schema";

/*===== Booking Form =====*/
/**
 * The customer's booking sheet: four numbered parts (which dog, where, when, what for) beside the receipt that fills
 * in as they go. One `<form>`, so the receipt's button, the phone bar's button and Enter all submit the same thing.
 * When no dog can book, the parts after the first wait, dimmed.
 */
export function BookingForm({
  options,
  liveEnrollmentIds,
  initialDogId,
  assessmentId,
}: {
  options: BookingOptions;
  liveEnrollmentIds: Readonly<Record<string, string>>;
  initialDogId: string;
  /** From `?assessment=` on Dog Detail's recommendations; the server drops one that isn't this dog's. */
  assessmentId: string | null;
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const book = useBookCourse();
  const { course, kind, dogs } = options;
  const isTest = kind === "test";

  const schema = useMemo(
    () =>
      createBookingFormSchema({
        retakeDogIds: new Set(dogs.filter((entry) => entry.eligible && entry.hasPassed).map((entry) => entry.dog.id)),
      }),
    [dogs],
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormDefaults({ dogId: initialDogId }),
  });

  const values = useWatch({ control });
  const firstPartRef = useRef<HTMLFieldSetElement>(null);

  const waiting = !dogs.some((entry) => entry.eligible);
  // Kept busy after success too: the page is on its way to Checkout, and the button must not invite a second try.
  const busy = book.isPending || book.isSuccess;

  const chosen = dogs.find((entry) => entry.eligible && entry.dog.id === values.dogId) ?? null;
  const boarding = !isTest && values.place === "boarding" && course.boardingPrice !== null;
  const total = (course.price ?? 0) + (boarding ? (course.boardingPrice ?? 0) : 0);

  /*------ Submit ------*/
  const onSubmit = handleSubmit((input) => {
    book.mutate(
      {
        courseSlug: course.slug,
        kind,
        dogId: input.dogId,
        trainingGoal: input.trainingGoal,
        boarding: !isTest && input.place === "boarding",
        address: input.place === "home" ? input.address : null,
        preferredTimes: input.preferredTimes,
        confirmRetake: input.confirmRetake,
        assessmentId: assessmentId ?? chosen?.recommendation?.assessmentId ?? null,
      },
      {
        onSuccess: async ({ orderId }) => {
          await navigate(`/account/checkout/${orderId}`, { viewTransition: true });
        },
        onError: (error) =>
          applyBookingError({
            error,
            setError,
            // The server's answer changes who can book, so the page reloads its dogs.
            onStale: () => {
              setValue("dogId", "");
              void revalidator.revalidate();
            },
          }),
      },
    );
  });

  const placeIsHome = isTest || values.place !== "boarding";

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      className="site-container grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 pt-10 pb-28 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-20 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
    >
      <div className="flex max-w-[44rem] min-w-0 flex-col gap-12">
        <FormAlert message={errors.root?.message} />

        {/*------ 1. Which Dog ------*/}
        <BookingPart number={1} title="کدام سگ؟" partRef={firstPartRef}>
          {dogs.length === 0 ? (
            <NoDogs newDogHref={newDogHref(course.slug, kind)} />
          ) : (
            <>
              {waiting && (
                <p className="text-pretty text-muted-foreground">
                  هیچ‌کدام از سگ‌هایت الان نمی‌تواند این {isTest ? "تست" : "دوره"} را بگیرد. دلیلش زیر هر کدام نوشته
                  شده.
                </p>
              )}
              <DogPicker
                options={options}
                liveEnrollmentIds={liveEnrollmentIds}
                registration={register("dogId")}
                error={errors.dogId}
                newDogHref={newDogHref(course.slug, kind)}
              />
              {chosen?.hasPassed && <RetakeNotice control={control} dogName={chosen.dog.name} isTest={isTest} />}
            </>
          )}
        </BookingPart>

        {/*------ 2. Where ------*/}
        <BookingPart number={2} title="کجا؟" waiting={waiting}>
          {!isTest && (
            <PlaceChoice boardingPrice={course.boardingPrice} registration={register("place")} error={errors.place} />
          )}

          {placeIsHome ? (
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="book-address">نشانی، با کوچه و پلاک</FieldLabel>
              <Input
                id="book-address"
                autoComplete="street-address"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldDescription>
                {isTest
                  ? "جایی که سگ را می‌بینم."
                  : "جایی که جلسه‌ها برگزار می‌شود؛ بیرون از خانه را با هم هماهنگ می‌کنیم."}
              </FieldDescription>
              <FieldError errors={[errors.address]} />
            </Field>
          ) : (
            <p className="text-pretty text-muted-foreground">
              سگ در پانسیون آرمان می‌ماند و آموزش همان‌جا ادامه دارد؛ نشانی لازم نیست.
            </p>
          )}
        </BookingPart>

        {/*------ 3. When ------*/}
        <BookingPart number={3} title="کی برایت مناسب است؟" waiting={waiting}>
          <Field data-invalid={!!errors.preferredTimes}>
            <FieldLabel htmlFor="book-times" className="sr-only">
              کی برایت مناسب است؟
            </FieldLabel>
            <Textarea
              id="book-times"
              rows={3}
              placeholder="مثلاً: شنبه‌ها و دوشنبه‌ها بعد از ساعت ۱۷"
              aria-invalid={!!errors.preferredTimes}
              {...register("preferredTimes")}
            />
            <FieldDescription>آرمان با تو تماس می‌گیرد و وقت اولین جلسه را با هم می‌گذارید.</FieldDescription>
            <FieldError errors={[errors.preferredTimes]} />
          </Field>
        </BookingPart>

        {/*------ 4. What For ------*/}
        <BookingPart number={4} title="برای چه؟" waiting={waiting}>
          <GoalPicker registration={register("trainingGoal")} error={errors.trainingGoal} />
        </BookingPart>
      </div>

      {/*------ Receipt ------*/}
      {/* After the form in the DOM, so on phones it sits at the end, just above the bar's button. */}
      <aside aria-label="رسید رزرو" className="lg:sticky lg:top-8 lg:self-start">
        <BookingReceipt
          course={course}
          kind={kind}
          dog={chosen?.dog ?? null}
          boarding={boarding}
          total={total}
          pending={busy}
          blocked={waiting}
        />
      </aside>

      <PhoneBookingBar firstPartRef={firstPartRef} total={total} pending={busy} blocked={waiting} />
    </form>
  );
}

/** Adding a dog from here brings them back to this booking; the Dog Form adds the new dog's id to the address. */
function newDogHref(slug: string, kind: BookingOptions["kind"]) {
  const back = `/account/book/${slug}${kind === "test" ? "?kind=test" : ""}`;
  return `/account/dogs/new?redirectTo=${encodeURIComponent(back)}`;
}

/*===== Server Errors =====*/
/**
 * Says what the server's answer means for the person, in the form's own places:
 * - `NOT_ELIGIBLE`: the dog can't book (the server's sentences say why); the choice goes and the page reloads.
 * - `NOT_FOUND`: the course or the dog is gone; the page reloads.
 * - `INVALID_INPUT`: the server's field messages go next to their fields.
 * `onStale` is for the answers that mean the page's dogs are out of date.
 */
function applyBookingError({
  error,
  setError,
  onStale,
}: {
  error: Error;
  setError: UseFormSetError<BookingFormInput>;
  onStale: () => void;
}) {
  const code = error instanceof ORPCError ? error.code : null;
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;

  if (code === "NOT_ELIGIBLE") {
    onStale();
    // All the reasons, not the first: a dog can fail on age and on a prerequisite at once.
    setError("root", { message: parsed?.success ? parsed.data.errors.join(" ") : "این سگ نمی‌تواند این را بگیرد." });
    return;
  }

  if (code === "NOT_FOUND") {
    onStale();
    setError("root", { message: "این سگ یا این دوره دیگر پیدا نشد. فهرست را تازه کردم؛ دوباره انتخاب کن." });
    return;
  }

  const failure = describeApiFailure({ error, fallback: "رزرو نشد. دوباره امتحان کن." });
  let placed = false;
  for (const [serverField, message] of Object.entries(failure.fields)) {
    const field = toFormField(serverField);
    if (field) {
      setError(field, { message });
      placed = true;
    }
  }
  // A message that belongs to no field of this form still has to be seen.
  if (failure.message || !placed) setError("root", { message: failure.message ?? "رزرو نشد. دوباره امتحان کن." });
}
