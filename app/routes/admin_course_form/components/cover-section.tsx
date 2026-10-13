import { cn } from "cn";
import { CameraIcon } from "lucide-react";
import { useEffect, useId } from "react";
import { useFormContext } from "react-hook-form";

import { buttonVariants } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { MEDIA_ACCEPTED_TYPES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { useCoverUpload } from "~/routes/admin_course_form/hooks/use-cover-upload";
import type { CourseFormInput } from "~/routes/admin_course_form/schema";

/*===== Cover Section =====*/
/**
 * «عکس دوره»: the cover at 3:2, the way the card crops it, a button to pick or replace it, and its description. A
 * picked file uploads at once and the form keeps only its id; on `edit` the course's own cover shows until a new one
 * is uploaded, and nothing is sent for it if none is.
 */
export function CoverSection({
  uploaded,
  currentSrc,
  onUploaded,
  onBusyChange,
  error,
}: {
  /** The photo uploaded in this visit, if any. */
  uploaded: Media | null;
  /** The saved cover's address on `edit`. */
  currentSrc: string | null;
  onUploaded: (media: Media) => void;
  /** True while an upload runs, so the form holds its save. */
  onBusyChange: (busy: boolean) => void;
  /** The server's or the form's message about the cover. */
  error: string | undefined;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const cover = useCoverUpload({ onUploaded });
  const { isPending } = cover;
  // Lets the form hold its save while the file is on its way.
  useEffect(() => {
    onBusyChange(isPending);
  }, [isPending, onBusyChange]);

  const shownSrc = uploaded?.urls.card ?? currentSrc;
  const message = cover.problem ?? error;
  const hasPhoto = Boolean(cover.preview ?? shownSrc);

  return (
    <FormSection title="عکس دوره">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/*------ Frame ------*/}
        <div
          className={cn(
            "relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-xl border bg-sunken sm:w-64",
            message ? "border-destructive/60" : "border-border",
          )}
        >
          {cover.preview ? (
            <img src={cover.preview} alt="" className="size-full object-cover opacity-50" />
          ) : shownSrc ? (
            <img src={shownSrc} alt="" className="size-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-muted-foreground">
              <CameraIcon aria-hidden strokeWidth={1.5} className="size-7" />
            </span>
          )}
          {isPending && (
            <span className="absolute inset-0 grid place-items-center">
              <Spinner aria-label="در حال بارگذاری" className="size-7 text-foreground" />
            </span>
          )}
        </div>

        {/*------ Picker ------*/}
        <div className="flex min-w-0 flex-col items-start gap-2">
          <label
            htmlFor={inputId}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-pointer has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              isPending && "pointer-events-none opacity-50",
            )}
          >
            <CameraIcon aria-hidden strokeWidth={1.75} />
            {hasPhoto ? "عوض کردن عکس" : "انتخاب عکس"}
            <input
              id={inputId}
              type="file"
              accept={MEDIA_ACCEPTED_TYPES}
              aria-describedby={message ? `${hintId} ${errorId}` : hintId}
              aria-invalid={message ? true : undefined}
              className="sr-only"
              disabled={isPending}
              onChange={(event) => {
                cover.pick(event.target.files?.[0]);
                // Lets the same file be picked again after a failure.
                event.target.value = "";
              }}
            />
          </label>
          <p id={hintId} className="text-sm text-pretty text-muted-foreground">
            {isPending ? "در حال بارگذاری…" : "عکس افقی بهتر است؛ از دو طرف بریده می‌شود."}
          </p>
          {message && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}
        </div>
      </div>

      {/*------ Description ------*/}
      <Field data-invalid={!!errors.coverAlt}>
        <FieldLabel htmlFor="course-cover-alt">توضیح عکس</FieldLabel>
        <Input
          id="course-cover-alt"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.coverAlt}
          {...register("coverAlt")}
        />
        <FieldDescription>برای کسی که عکس را نمی‌بیند: صحنه را بنویس.</FieldDescription>
        <FieldError errors={[errors.coverAlt]} />
      </Field>
    </FormSection>
  );
}
