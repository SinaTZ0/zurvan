import { cn } from "cn";
import { CameraIcon, CircleCheckIcon, FileVideoIcon, VideoIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useId, useReducer, useRef, useState } from "react";

import { MediaImage } from "~/components/media-image";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Spinner } from "~/components/ui/spinner";
import { formatNumberFa } from "~/lib/digits";
import {
  EVALUATION_MAX_PHOTOS,
  EVALUATION_MAX_VIDEOS,
  EVALUATION_VIDEO_ACCEPTED_TYPES,
  EVALUATION_VIDEO_MAX_BYTES,
} from "~/orpc/evaluation/constants";
import type { EvaluationVideo } from "~/orpc/evaluation/contract";
import { MEDIA_ACCEPTED_TYPES, MEDIA_MAX_BYTES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";

import { RisingError } from "~/routes/assessment/components/rising-error";
import { usePhotoUpload } from "~/routes/assessment/hooks/use-photo-upload";
import { useVideoUpload } from "~/routes/assessment/hooks/use-video-upload";

/*===== Constants =====*/
// The thumbnails are small taped prints: a strip of tape with torn ends across each top, the tilts alternating.
const TAPE =
  "pointer-events-none absolute -top-2 left-1/2 h-3.5 w-10 -translate-x-1/2 bg-foreground/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)]";
const PRINT_TILTS = ["-rotate-2", "rotate-[1.5deg]", "-rotate-1", "rotate-2"] as const;

const BYTES_PER_MB = 1024 * 1024;
const ACCEPT = `${MEDIA_ACCEPTED_TYPES},${EVALUATION_VIDEO_ACCEPTED_TYPES}`;

const sizeFormat = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });

/** «۱۲٫۴ مگابایت», or kilobytes for small files. */
function formatSize(bytes: number): string {
  if (bytes < BYTES_PER_MB) return `${sizeFormat.format(Math.max(1, Math.round(bytes / 1024)))} کیلوبایت`;
  return `${sizeFormat.format(bytes / BYTES_PER_MB)} مگابایت`;
}

/*===== Items =====*/
/**
 * One picked file. `other` is a file of an unsupported type: it only ever exists as an error row. Rows in the `error`
 * state never count toward the limits and never reach `onChange`.
 */
type Item = {
  key: string;
  kind: "photo" | "video" | "other";
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  /** Percent sent, videos only. */
  progress: number;
  /** Object URL of the picked photo while it uploads. */
  preview?: string;
  media?: Media;
  video?: EvaluationVideo;
  error?: string;
};

type Action =
  | { type: "add"; items: Item[] }
  | { type: "progress"; key: string; progress: number }
  | { type: "photoDone"; key: string; media: Media }
  | { type: "videoDone"; key: string; video: EvaluationVideo }
  | { type: "fail"; key: string; error: string }
  | { type: "remove"; key: string };

// Every update is keyed, so uploads finishing in any order, or a row removed mid-upload, can't clobber one another
// (a plain `setState` with a captured list would).
function reducer(items: Item[], action: Action): Item[] {
  switch (action.type) {
    case "add":
      return [...items, ...action.items];
    case "remove":
      return items.filter((item) => item.key !== action.key);
    case "progress":
      return items.map((item) => (item.key === action.key ? { ...item, progress: action.progress } : item));
    case "photoDone":
      return items.map((item) =>
        item.key === action.key ? { ...item, status: "done", preview: undefined, media: action.media } : item,
      );
    case "videoDone":
      return items.map((item) =>
        item.key === action.key ? { ...item, status: "done", progress: 100, video: action.video } : item,
      );
    case "fail":
      return items.map((item) =>
        item.key === action.key ? { ...item, status: "error", preview: undefined, error: action.error } : item,
      );
  }
}

/*===== File Kind =====*/
function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Sends each file to the right upload by its type, falling back to the extension (phones and some browsers leave the
 * type empty). HEIC counts as a photo here so the server's own refusal message reaches the customer.
 */
function classify(file: File): "photo" | "video" | "other" {
  const extension = extensionOf(file);
  if (
    /^image\/(jpeg|png|webp|hei[cf])$/i.test(file.type) ||
    ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension)
  ) {
    return "photo";
  }
  if (["video/mp4", "video/quicktime"].includes(file.type) || ["mp4", "mov"].includes(extension)) return "video";
  return "other";
}

/*===== Evaluation Media Field =====*/
/**
 * The optional photos and videos of an evaluation request (F3). One drop zone takes both; each file uploads at once
 * (photos through `media.upload`, videos to the progress-reporting resource route), so submitting the form only sends
 * ids.
 *
 * `onChange` reports only fully uploaded files: an id exists only after the server stored the file, and a half-sent
 * upload must never be referenced by the request. `onBusyChange` lets the form hold its submit button meanwhile.
 *
 * The server refuses a customer more than `EVALUATION_VIDEO_MAX_UNSENT` unsent videos; its message is shown as that
 * row's error. Removing a sent-up video asks the server to free it, so a few retries don't exhaust that cap.
 */
export function EvaluationMediaField({
  onChange,
  onBusyChange,
  errors,
}: {
  /** Called after every change with the ids to send in `evaluation.request` (only fully uploaded files). */
  onChange: (value: { photoMediaIds: string[]; videoIds: string[] }) => void;
  /** True while any upload is running, so the form can disable its submit button. */
  onBusyChange: (busy: boolean) => void;
  /** Server messages from submitting (`data.fields.photoMediaIds` / `videoIds`). */
  errors?: { photos?: string; videos?: string };
}) {
  const baseId = useId();
  const [items, dispatch] = useReducer(reducer, []);
  const [dragging, setDragging] = useState(false);
  const nextKey = useRef(0);
  const previews = useRef(new Set<string>());

  const photoUpload = usePhotoUpload();
  const videoUpload = useVideoUpload();

  /*------ Object URLs ------*/
  const revokePreview = useCallback((url: string | undefined) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    previews.current.delete(url);
  }, []);

  useEffect(() => {
    const live = previews.current;
    return () => live.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  /*------ Reporting to the Form ------*/
  const photoIds = items.flatMap((item) => (item.kind === "photo" && item.media ? [item.media.id] : []));
  const videoIds = items.flatMap((item) => (item.kind === "video" && item.video ? [item.video.id] : []));
  const photoKey = photoIds.join("|");
  const videoKey = videoIds.join("|");
  const busy = items.some((item) => item.status === "uploading");

  // Effect events, so a parent passing fresh inline callbacks each render doesn't re-run the effects.
  const reportChange = useEffectEvent(onChange);
  const reportBusy = useEffectEvent(onBusyChange);

  useEffect(() => {
    reportChange({
      photoMediaIds: photoKey ? photoKey.split("|") : [],
      videoIds: videoKey ? videoKey.split("|") : [],
    });
  }, [photoKey, videoKey]);

  useEffect(() => {
    reportBusy(busy);
  }, [busy]);

  /*------ Picking Files ------*/
  const addFiles = (files: File[]) => {
    // Counted from the list as of this render; rows that failed make room again.
    let photos = items.filter((item) => item.kind === "photo" && item.status !== "error").length;
    let videos = items.filter((item) => item.kind === "video" && item.status !== "error").length;
    const added: Item[] = [];

    for (const file of files) {
      const key = `${baseId}-${nextKey.current++}`;
      const kind = classify(file);
      const base = { key, kind, name: file.name, size: file.size, progress: 0 } as const;
      const refuse = (error: string) => added.push({ ...base, status: "error", error });

      if (kind === "other") {
        refuse("این نوع فایل پشتیبانی نمی‌شه.");
      } else if (kind === "photo") {
        if (photos >= EVALUATION_MAX_PHOTOS) {
          refuse(`حداکثر ${formatNumberFa(EVALUATION_MAX_PHOTOS)} عکس می‌شه.`);
        } else if (file.size > MEDIA_MAX_BYTES) {
          refuse(`این عکس بزرگ‌تر از ${formatNumberFa(MEDIA_MAX_BYTES / BYTES_PER_MB)} مگابایته.`);
        } else {
          photos += 1;
          const preview = URL.createObjectURL(file);
          previews.current.add(preview);
          added.push({ ...base, status: "uploading", preview });
          photoUpload.upload({ key, file }).then(
            (media) => {
              revokePreview(preview);
              dispatch({ type: "photoDone", key, media });
            },
            (error: Error) => {
              revokePreview(preview);
              dispatch({ type: "fail", key, error: error.message });
            },
          );
        }
      } else {
        if (videos >= EVALUATION_MAX_VIDEOS) {
          refuse(`حداکثر ${formatNumberFa(EVALUATION_MAX_VIDEOS)} فیلم می‌شه.`);
        } else if (file.size > EVALUATION_VIDEO_MAX_BYTES) {
          refuse(`این فیلم بزرگ‌تر از ${formatNumberFa(EVALUATION_VIDEO_MAX_BYTES / BYTES_PER_MB)} مگابایته.`);
        } else {
          videos += 1;
          added.push({ ...base, status: "uploading" });
          videoUpload
            .upload({ key, file, onProgress: (progress) => dispatch({ type: "progress", key, progress }) })
            .then(
              (video) => dispatch({ type: "videoDone", key, video }),
              (error: Error) => {
                // A row removed mid-upload aborts its request; the row is already gone.
                if (error.name === "AbortError") return;
                dispatch({ type: "fail", key, error: error.message });
              },
            );
        }
      }
    }

    if (added.length) dispatch({ type: "add", items: added });
  };

  /*------ Removing ------*/
  const remove = (item: Item) => {
    if (item.status === "uploading") {
      if (item.kind === "photo") photoUpload.cancel(item.key);
      else videoUpload.cancel(item.key);
    }
    if (item.kind === "video" && item.video) videoUpload.discard(item.video.id);
    revokePreview(item.preview);
    dispatch({ type: "remove", key: item.key });
  };

  const photos = items.filter((item) => item.kind === "photo" && item.status !== "error");
  const videos = items.filter((item) => item.kind === "video" && item.status !== "error");
  const problems = items.filter((item) => item.status === "error");

  const inputId = `${baseId}-input`;
  const hintId = `${baseId}-hint`;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/*===== Limits =====*/}
      {/* The plate around the field carries its heading («عکس و فیلم», اختیاری) and what the files are for. */}
      <p id={hintId} className="text-sm text-pretty text-muted-foreground">
        تا {formatNumberFa(EVALUATION_MAX_PHOTOS)} عکس (JPG یا PNG)، تا {formatNumberFa(EVALUATION_MAX_VIDEOS)} فیلم؛ هر
        فیلم تا {formatNumberFa(EVALUATION_VIDEO_MAX_BYTES / BYTES_PER_MB)} مگابایت، mp4 یا mov.
      </p>

      {/*===== Drop Zone =====*/}
      {/* Dropping is a mouse shortcut for the real file input inside, which keyboards and screen readers use. */}
      <div
        role="presentation"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-4 py-9 text-center transition-colors",
            "border-foreground/25 hover:border-primary/60 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <span className="flex items-center gap-3 text-primary">
            <CameraIcon aria-hidden strokeWidth={1.5} className="size-8" />
            <VideoIcon aria-hidden strokeWidth={1.5} className="size-8" />
          </span>
          <span className="text-sm font-bold">عکس و فیلم رو اینجا بنداز یا انتخاب کن</span>
          <input
            id={inputId}
            type="file"
            multiple
            accept={ACCEPT}
            aria-describedby={hintId}
            className="sr-only"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              // Lets the same file be picked again after removing it.
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {/*===== Photos =====*/}
      {/* Small prints taped to the plate, a little crooked, alternating; each rises in as it is picked. */}
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5 pt-2 sm:grid-cols-4">
          {photos.map((item, index) => (
            <li key={item.key} className={cn("answer-in relative", PRINT_TILTS[index % PRINT_TILTS.length])}>
              <div className="rounded-[3px] bg-foreground p-1 shadow-[0_10px_22px_-10px_rgb(0_0_0/0.95)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-sunken">
                  {item.media ? (
                    <MediaImage
                      media={item.media}
                      variant="thumb"
                      alt={`عکس ${formatNumberFa(index + 1)}`}
                      className="size-full"
                    />
                  ) : (
                    <>
                      {item.preview && <img src={item.preview} alt="" className="size-full object-cover opacity-50" />}
                      <span className="absolute inset-0 grid place-items-center">
                        <Spinner aria-label="در حال بارگذاری" className="size-6 text-foreground" />
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span aria-hidden className={TAPE} />
              <RemoveButton
                label={`حذف عکس ${formatNumberFa(index + 1)}`}
                onClick={() => remove(item)}
                className="absolute -end-2 -top-2"
              />
            </li>
          ))}
        </ul>
      )}

      {/*===== Videos =====*/}
      {videos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {videos.map((item) => (
            <li
              key={item.key}
              className="answer-in flex items-center gap-3 rounded-2xl border border-foreground/15 bg-card paper-grain p-3"
            >
              <FileVideoIcon aria-hidden strokeWidth={1.5} className="size-6 shrink-0 text-primary" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <bdi dir="ltr" className="truncate font-bold">
                    {item.name}
                  </bdi>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatSize(item.size)}</span>
                </div>
                {item.status === "done" ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CircleCheckIcon aria-hidden className="size-4 text-primary" />
                    بارگذاری شد
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* No width transition: only transform and opacity are animated in this app. */}
                    <Progress
                      value={item.progress}
                      aria-label={`بارگذاری ${item.name}`}
                      className="flex-1 [&_[data-slot=progress-indicator]]:transition-none"
                    />
                    <span className="w-16 shrink-0 text-end text-xs text-muted-foreground">
                      {/* The bytes are all sent at 100% but the server is still storing the file. */}
                      {item.progress >= 100 ? "در حال ذخیره…" : `${formatNumberFa(item.progress)}٪`}
                    </span>
                  </div>
                )}
              </div>
              <RemoveButton label={`حذف ${item.name}`} onClick={() => remove(item)} />
            </li>
          ))}
        </ul>
      )}

      {/*===== Problems =====*/}
      {/* Always rendered, so a screen reader announces a row appearing in it. */}
      <ul aria-live="polite" className="flex flex-col gap-2 empty:hidden">
        {problems.map((item) => (
          <li
            key={item.key}
            className="answer-in flex items-center gap-3 rounded-2xl border border-destructive/40 bg-card paper-grain p-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
              <bdi dir="ltr" className="truncate font-bold">
                {item.name}
              </bdi>
              <span className="text-destructive">{item.error}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => remove(item)}
              aria-label={`حذف ${item.name}`}
            >
              حذف
            </Button>
          </li>
        ))}
      </ul>

      {/*===== Server Messages =====*/}
      <RisingError id={`${baseId}-photos-error`} message={errors?.photos} />
      <RisingError id={`${baseId}-videos-error`} message={errors?.videos} />
    </div>
  );
}

/*===== Remove Button =====*/
function RemoveButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-xs"
      aria-label={label}
      onClick={onClick}
      className={cn("rounded-full border border-foreground/20 bg-background hover:bg-muted", className)}
    >
      <XIcon aria-hidden />
    </Button>
  );
}
