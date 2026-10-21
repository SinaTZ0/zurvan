import { cn } from "cn";
import { CameraIcon, CheckIcon } from "lucide-react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { buttonVariants } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { MEDIA_ACCEPTED_TYPES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { INK_OUTLINE } from "~/routes/admin_course_form/surfaces";
import { useCoverUpload } from "~/routes/admin_course_form/hooks/use-cover-upload";
import type { CourseFormInput } from "~/routes/admin_course_form/schema";

const INPUT_ID = "course-coverMediaId";

/*===== Cover Section =====*/
/**
 * «عکس دوره»: the cover as a print at 16:9, the way the card crops it, a button to pick or replace it, and its
 * description. A picked file uploads at once and the form keeps only its id; on `edit` the course's own cover shows
 * until a new one is uploaded, and nothing is sent for it if none is.
 *
 * The print answers each step: dimmed with a spinner while the file is on its way, pressed in when it has arrived
 * (`animate-tag-stamp`, keyed by the photo), and a destructive frame with the reason when it failed (the photo that
 * was there stays).
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
    <FormSection id="cover">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        {/*------ Print ------*/}
        {/* A print on the plate: the card's paper round the photo and an ink ring, as the Evaluations prints are. */}
        <div
          className={cn(
            "w-full shrink-0 rounded-2xl bg-card p-1.5 ring-1 sm:w-72",
            message ? "ring-destructive/60" : "ring-foreground/15",
          )}
        >
          <div
            key={uploaded?.id ?? "saved"}
            className={cn(
              "relative aspect-video overflow-hidden rounded-xl bg-sunken",
              uploaded && "motion-safe:animate-tag-stamp",
            )}
          >
            {cover.preview ? (
              <img src={cover.preview} alt="" className="size-full object-cover opacity-45" />
            ) : shownSrc ? (
              <img src={shownSrc} alt="" className="size-full object-cover" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                <CameraIcon aria-hidden strokeWidth={1.5} className="size-7" />
              </span>
            )}
            {isPending && (
              <span className="absolute inset-0 grid place-items-center">
                <Spinner aria-hidden className="size-7 text-foreground" />
              </span>
            )}
          </div>
        </div>

        {/*------ Picker ------*/}
        <div className="flex min-w-0 flex-col items-start gap-2.5">
          <label
            htmlFor={INPUT_ID}
            className={cn(
              buttonVariants({ variant: "outline", className: INK_OUTLINE }),
              "cursor-pointer has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              isPending && "pointer-events-none opacity-50",
            )}
          >
            <CameraIcon aria-hidden strokeWidth={1.75} />
            {hasPhoto ? "عوض کردن عکس" : "انتخاب عکس"}
            <input
              id={INPUT_ID}
              type="file"
              accept={MEDIA_ACCEPTED_TYPES}
              aria-describedby={describedBy({ id: INPUT_ID, hint: true, error: !!message })}
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
          <FieldHint id={INPUT_ID}>
            <span aria-live="polite">
              {isPending ? (
                "داره بار می‌شه…"
              ) : uploaded ? (
                <span className="inline-flex items-start gap-1.5 text-foreground/85">
                  <CheckIcon aria-hidden strokeWidth={2.2} className="mt-0.5 size-3.5 shrink-0" />
                  عکس تازه رسید؛ با ذخیره سر جاش می‌شینه.
                </span>
              ) : (
                "عکس افقی بهتره؛ از دو طرف بریده می‌شه."
              )}
            </span>
          </FieldHint>
          <FieldMessage id={INPUT_ID} message={message} />
        </div>
      </div>

      {/*------ Description ------*/}
      <Field data-invalid={!!errors.coverAlt} className="gap-2">
        <FieldLabel htmlFor="course-coverAlt">توضیح عکس</FieldLabel>
        <Input
          id="course-coverAlt"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.coverAlt}
          aria-describedby={describedBy({ id: "course-coverAlt", hint: true, error: !!errors.coverAlt })}
          {...register("coverAlt")}
        />
        <FieldHint id="course-coverAlt">برای کسی که عکس رو نمی‌بینه: صحنه رو بنویس.</FieldHint>
        <FieldMessage id="course-coverAlt" message={errors.coverAlt?.message} />
      </Field>
    </FormSection>
  );
}
