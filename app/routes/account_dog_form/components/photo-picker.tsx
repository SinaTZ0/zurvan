import { isDefinedError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { cn } from "cn";
import { CameraIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatNumber } from "~/lib/locale-format";
import { orpc } from "~/orpc/client";
import { MEDIA_ACCEPTED_TYPES, MEDIA_MAX_BYTES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";
import { m } from "~/paraglide/messages";

const MAX_MB = MEDIA_MAX_BYTES / (1024 * 1024);

/*===== Tape =====*/
// A strip of translucent tape with torn ends, in a paper tone (the Dashboard's print): the print's border is ivory, so
// ivory tape would vanish on it.
const TAPE =
  "pointer-events-none absolute h-4 w-10 bg-[rgb(214_196_150/0.8)] [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] lg:h-5 lg:w-20";

/*===== Photo Picker =====*/
/**
 * The dog's photo IS the picker, and it is a print taped to the mount: pick or drop an image and it uploads at once
 * (docs/media.md, "Upload Flow"), so saving the form only sends its id. While it uploads, the picked file shows dimmed
 * from memory with a spinner on it; afterwards, the stored image. Without a photo the print holds the engraved tag
 * (the name as typed, or «؟») and the «افزودن عکس» pill.
 *
 * It renders ONE file input and two grid cells of the mount, with no wrapper box of its own (`display: contents`): the
 * print and the actions (the hint for screen readers, «افزودن عکس» on phones, «تغییر عکس», «حذف عکس», the error). The
 * mount places both, because they sit differently on phones (a 7rem print beside the name) and on desktop (a 20rem
 * print with the actions beside its bubble). The print is also the drop target.
 *
 * The print drops onto the mount again whenever the photo changes (keyed by the media id, `df-drop`). The file input
 * sits outside that keyed print, so a keyboard user's focus survives the re-drop; the print shows its focus ring.
 */
export function PhotoPicker({
  media,
  onChange,
  onBusyChange,
  error,
  tagName,
  microchipNumber,
  frameClassName,
  actionsClassName,
}: {
  media: Media | null;
  onChange: (media: Media | null) => void;
  /** Called with true while an upload runs, false otherwise, so the form can hold its submit. */
  onBusyChange: (busy: boolean) => void;
  /** A server message about the photo, from saving the form. */
  error?: string;
  /** The name on the engraved tag of an empty print. */
  tagName: string;
  microchipNumber: string | null;
  /** Placement and size of the print's cell. */
  frameClassName?: string;
  /** Placement of the actions cell. */
  actionsClassName?: string;
}) {
  const inputId = useId();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = useMutation(orpc.media.upload.mutationOptions());
  const uploading = upload.isPending;

  // The picked file's object URL lives only while it is shown.
  useEffect(() => () => (localPreview ? URL.revokeObjectURL(localPreview) : undefined), [localPreview]);

  useEffect(() => {
    onBusyChange(uploading);
  }, [uploading, onBusyChange]);

  /*------ Upload ------*/
  const pick = (file: File | undefined) => {
    if (!file || uploading) return;
    setProblem(null);
    if (file.size > MEDIA_MAX_BYTES) {
      setProblem(m.account_dog_form_photo_too_big({ max: formatNumber(MAX_MB) }));
      return;
    }
    setLocalPreview(URL.createObjectURL(file));
    upload.mutate(
      { kind: "dog", file },
      {
        onSuccess: (uploaded) => onChange(uploaded),
        onError: (uploadError) => {
          const fieldMessage =
            isDefinedError(uploadError) && uploadError.code === "INVALID_INPUT"
              ? uploadError.data.fields.file
              : undefined;
          setProblem(fieldMessage ?? m.account_dog_form_photo_failed());
        },
        onSettled: () => setLocalPreview(null),
      },
    );
  };

  const message = problem ?? error;
  const labelId = `${inputId}-label`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const formats = m.account_dog_form_photo_formats({ max: formatNumber(MAX_MB) });

  return (
    <div className="contents">
      {/*===== Print =====*/}
      {/* Dropping a file is a mouse shortcut for the file input, which keyboards and screen readers use. */}
      <div
        role="presentation"
        className={cn("group/print relative", frameClassName)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files[0]);
        }}
      >
        {/* A little crooked on the mount, taped across its top corners. */}
        <div className="-rotate-2">
          <figure key={media?.id ?? "none"} className="df-drop relative">
            <label
              htmlFor={inputId}
              className={cn(
                "block cursor-pointer rounded-sm bg-foreground p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.9)] transition-shadow lg:p-2.5",
                "group-has-focus-visible/print:ring-4 group-has-focus-visible/print:ring-ring/60",
                message && !media && "ring-3 ring-destructive/70",
              )}
            >
              <span
                className={cn(
                  "relative grid h-[8.5rem] w-full place-items-center overflow-hidden bg-sunken paper-grain lg:h-[17rem]",
                  dragging && "outline-2 -outline-offset-8 outline-primary outline-dashed",
                )}
              >
                {/*------ Photo ------*/}
                {localPreview ? (
                  <img src={localPreview} alt="" className="size-full object-cover opacity-50" />
                ) : media ? (
                  <MediaImage
                    media={media}
                    variant="card"
                    alt={m.account_dog_form_photo_current_alt()}
                    className="size-full object-cover"
                  />
                ) : (
                  <>
                    {/*------ Empty Print (phone) ------*/}
                    <DogTag
                      name={tagName}
                      microchipNumber={microchipNumber}
                      size="portrait"
                      stampKey={tagName}
                      className="lg:hidden"
                    />

                    {/*------ Empty Print (desktop) ------*/}
                    <span className="hidden flex-col items-center gap-3 lg:flex">
                      <DogTag name={tagName} microchipNumber={microchipNumber} size="lg" stampKey={tagName} />
                      <span className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/70 px-4 text-sm font-bold text-primary transition-colors group-hover/print:bg-primary/10">
                        <CameraIcon aria-hidden strokeWidth={1.75} className="size-4" />
                        {m.account_dog_form_photo_add()}
                      </span>
                    </span>
                  </>
                )}

                {uploading && (
                  <span className="absolute inset-0 grid place-items-center">
                    <Spinner
                      aria-label={m.account_dog_form_photo_uploading_aria()}
                      className="size-7 text-foreground"
                    />
                  </span>
                )}
              </span>
            </label>
            <span aria-hidden className={`${TAPE} -top-1.5 -right-3 rotate-45 lg:-right-5`} />
            <span aria-hidden className={`${TAPE} -top-1.5 -left-3 -rotate-45 lg:-left-5`} />
          </figure>
        </div>

        <span id={labelId} className="sr-only">
          {m.account_dog_form_photo_input_label()}
        </span>
        <input
          id={inputId}
          type="file"
          accept={MEDIA_ACCEPTED_TYPES}
          aria-labelledby={labelId}
          aria-describedby={message ? `${hintId} ${errorId}` : hintId}
          aria-invalid={message ? true : undefined}
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            pick(event.target.files?.[0]);
            // Lets the same file be picked again after removing it.
            event.target.value = "";
          }}
        />
      </div>

      {/*===== Actions =====*/}
      <div className={cn("flex min-w-0 flex-col items-start gap-2", actionsClassName)}>
        {/* Read aloud with the input; shown only while uploading (the empty desktop print has its own pill). */}
        <p id={hintId} className={cn("text-xs text-pretty text-muted-foreground lg:text-sm", !uploading && "sr-only")}>
          {uploading
            ? m.account_dog_form_photo_uploading()
            : media
              ? m.account_dog_form_photo_hint_replace()
              : m.account_dog_form_photo_hint_empty({ formats })}
        </p>

        {!uploading && (
          <div className="flex flex-wrap items-center gap-1">
            {/* Mouse and touch shortcuts to the same input: keyboards reach the input itself. */}
            <label
              htmlFor={inputId}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer border-primary/60 text-primary hover:text-primary",
                !media && "lg:hidden",
              )}
            >
              <CameraIcon aria-hidden strokeWidth={1.75} />
              {media ? m.account_dog_form_photo_change() : m.account_dog_form_photo_add()}
            </label>
            {media && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onChange(null)}
              >
                {m.account_dog_form_photo_remove()}
              </Button>
            )}
          </div>
        )}

        {message && (
          <p id={errorId} role="alert" className="answer-in text-sm text-pretty text-destructive">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
