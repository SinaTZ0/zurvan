import { isDefinedError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { cn } from "cn";
import { CameraIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { MediaImage } from "~/components/media-image";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatNumberFa } from "~/lib/digits";
import { orpc } from "~/orpc/client";
import { MEDIA_ACCEPTED_TYPES, MEDIA_MAX_BYTES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";

const MAX_MB = MEDIA_MAX_BYTES / (1024 * 1024);

/*===== Photo Picker =====*/
/**
 * The dog's photo IS the picker: pick or drop an image and it uploads at once (docs/media.md, "Upload Flow"), so saving
 * the form only sends its id. While it uploads, the picked file shows dimmed from memory and a spinner sits on it;
 * afterwards, the stored image.
 *
 * It renders ONE file input and two grid cells of the dog card, with no wrapper box of its own (`display: contents`):
 * the frame (the photo, or the empty slot) and the actions under it (hint, «تغییر عکس», «حذف عکس», the error). The card
 * places both cells, because they sit differently on phones (a 96px slot beside the name) and on desktop (a 4:3 frame
 * under the bubble). The frame is also the drop target.
 *
 * Keyboard and screen readers use the file input inside the frame; its label is the frame, and the focus ring shows on
 * the frame (`has-focus-visible`).
 */
export function PhotoPicker({
  media,
  onChange,
  onBusyChange,
  error,
  fallback,
  frameClassName,
  actionsClassName,
}: {
  media: Media | null;
  onChange: (media: Media | null) => void;
  /** Called with true while an upload runs, false otherwise, so the form can hold its submit. */
  onBusyChange: (busy: boolean) => void;
  /** A server message about the photo, from saving the form. */
  error?: string;
  /** Desktop only: shown in the empty frame above the «افزودن عکس» pill (the engraved tag). */
  fallback: React.ReactNode;
  /** Placement and size of the frame (its grid cell, the phone slot, the desktop 4:3). */
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
      setProblem(`این عکس بزرگ‌تر از ${formatNumberFa(MAX_MB)} مگابایت است. عکس کوچک‌تری انتخاب کن.`);
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
          setProblem(fieldMessage ?? "عکس بارگذاری نشد. دوباره امتحان کن.");
        },
        onSettled: () => setLocalPreview(null),
      },
    );
  };

  const message = problem ?? error;
  const hasImage = Boolean(localPreview ?? media);
  const labelId = `${inputId}-label`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <div className="contents">
      {/*===== Frame =====*/}
      {/* Dropping a file is a mouse shortcut for the file input inside, which keyboards and screen readers use. */}
      <div
        role="presentation"
        className={frameClassName}
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
        <label
          htmlFor={inputId}
          className={cn(
            "group relative grid size-full cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-sunken transition-colors lg:min-h-64 lg:rounded-3xl",
            "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            // A photo needs no outline. The empty phone slot is dashed so it reads as a place to put one; the desktop
            // frame is already a filled box, so it only shows the dashes while a file is dragged over it.
            hasImage ? "border-transparent" : "border-input/70 hover:border-primary/60 lg:border-transparent",
            message && !hasImage && "border-destructive/60 lg:border-destructive/60",
            dragging && "border-primary bg-primary/5 lg:border-primary",
          )}
        >
          {/*------ Photo ------*/}
          {localPreview ? (
            <img src={localPreview} alt="" className="size-full object-cover opacity-50" />
          ) : media ? (
            <MediaImage media={media} variant="card" alt="عکس فعلی سگ" className="size-full" />
          ) : (
            <>
              {/*------ Empty Slot (phone) ------*/}
              <span className="flex flex-col items-center gap-1 text-muted-foreground lg:hidden">
                <CameraIcon aria-hidden strokeWidth={1.5} className="size-6 text-primary" />
                <span className="text-xs font-bold">عکس</span>
              </span>

              {/*------ Empty Frame (desktop) ------*/}
              <span className="hidden flex-col items-center gap-4 py-6 lg:flex">
                {fallback}
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/60 px-4 text-sm font-bold text-primary transition-colors group-hover:bg-primary/10">
                  <CameraIcon aria-hidden strokeWidth={1.75} className="size-4" />
                  افزودن عکس
                </span>
              </span>
            </>
          )}

          {uploading && (
            <span className="absolute inset-0 grid place-items-center">
              <Spinner aria-label="در حال بارگذاری" className="size-7 text-foreground" />
            </span>
          )}

          <span id={labelId} className="sr-only">
            عکس سگ (اختیاری)
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
        </label>
      </div>

      {/*===== Actions =====*/}
      <div className={cn("flex min-w-0 flex-col items-start gap-2", actionsClassName)}>
        {/* Phones have the slot's own «عکس» label, so the hint is read aloud there and shown only while uploading. */}
        <p
          id={hintId}
          className={cn("text-xs text-pretty text-muted-foreground lg:text-sm", !uploading && "max-lg:sr-only")}
        >
          {uploading
            ? "در حال بارگذاری…"
            : media
              ? "عکس تازه‌ای انتخاب کن یا روی عکس رهایش کن."
              : `عکس واضحی از خودش، JPG یا PNG تا ${formatNumberFa(MAX_MB)} مگابایت.`}
        </p>

        {media && !uploading && (
          <div className="flex flex-wrap items-center gap-1">
            {/* A mouse and touch shortcut to the same input: keyboards reach the input in the frame. */}
            <label
              htmlFor={inputId}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden cursor-pointer lg:inline-flex")}
            >
              <CameraIcon aria-hidden strokeWidth={1.75} />
              تغییر عکس
            </label>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-destructive max-lg:-ms-2.5 lg:h-10"
              onClick={() => onChange(null)}
            >
              حذف عکس
            </Button>
          </div>
        )}

        {message && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
