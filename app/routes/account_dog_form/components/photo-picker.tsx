import { isDefinedError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { cn } from "cn";
import { CameraIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { MediaImage } from "~/components/media-image";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatNumberFa } from "~/lib/digits";
import { orpc } from "~/orpc/client";
import { MEDIA_ACCEPTED_TYPES, MEDIA_MAX_BYTES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";

const MAX_MB = MEDIA_MAX_BYTES / (1024 * 1024);

/*===== Photo Picker =====*/
/**
 * The dog's photo: pick or drop an image and it uploads at once (docs/media.md, "Upload Flow"), so saving the form
 * only sends its id. While it uploads, the picked file shows dimmed from memory; afterwards, the stored thumbnail.
 */
export function PhotoPicker({
  media,
  onChange,
  error,
}: {
  media: Media | null;
  onChange: (media: Media | null) => void;
  /** A server message about the photo, from saving the form. */
  error?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = useMutation(orpc.media.upload.mutationOptions());

  // The picked file's object URL lives only while it is shown.
  useEffect(() => () => (localPreview ? URL.revokeObjectURL(localPreview) : undefined), [localPreview]);

  /*------ Upload ------*/
  const pick = (file: File | undefined) => {
    if (!file) return;
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

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold" id={`${inputId}-label`}>
        عکس <span className="font-medium text-muted-foreground">(اختیاری)</span>
      </span>

      <div className="flex items-center gap-4">
        {/*------ Drop Zone / Preview ------*/}
        {/* Dropping a file is a mouse shortcut for the file input inside, which keyboards and screen readers use. */}
        <div
          role="presentation"
          className="shrink-0"
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
              "relative grid size-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border transition-colors sm:size-32",
              "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              media || localPreview
                ? "border-transparent"
                : "border-dashed border-input bg-sunken hover:border-primary/60",
              dragging && "border-primary bg-primary/5",
              message && !media && "border-destructive/60",
            )}
          >
            {localPreview ? (
              <img src={localPreview} alt="" className="size-full object-cover opacity-50" />
            ) : media ? (
              <MediaImage media={media} variant="thumb" alt="عکس فعلی سگ" className="size-full" />
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <CameraIcon aria-hidden strokeWidth={1.5} className="size-7 text-primary" />
                <span className="text-xs font-bold">انتخاب عکس</span>
              </span>
            )}
            {upload.isPending && (
              <span className="absolute inset-0 grid place-items-center">
                <Spinner className="size-6 text-foreground" />
              </span>
            )}
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={MEDIA_ACCEPTED_TYPES}
              aria-labelledby={`${inputId}-label`}
              aria-describedby={`${inputId}-hint`}
              className="sr-only"
              disabled={upload.isPending}
              onChange={(event) => {
                pick(event.target.files?.[0]);
                // Lets the same file be picked again after removing it.
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {/*------ Hint and Actions ------*/}
        <div className="flex flex-col items-start gap-2">
          <p id={`${inputId}-hint`} className="text-sm text-pretty text-muted-foreground">
            {upload.isPending
              ? "در حال بارگذاری…"
              : media
                ? "روی عکس بزن تا عوضش کنی."
                : `یک عکس واضح از خودش، JPG یا PNG تا ${formatNumberFa(MAX_MB)} مگابایت.`}
          </p>
          {media && !upload.isPending && (
            <Button type="button" variant="ghost" size="xs" className="text-destructive" onClick={() => onChange(null)}>
              حذف عکس
            </Button>
          )}
        </div>
      </div>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
