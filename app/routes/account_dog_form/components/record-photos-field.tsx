import { cn } from "cn";
import { CameraIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useId, useReducer, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import { MediaImage } from "~/components/media-image";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatNumber } from "~/lib/locale-format";
import { MEDIA_ACCEPTED_TYPES, MEDIA_MAX_BYTES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";
import { m } from "~/paraglide/messages";
import { useRecordUpload } from "~/routes/account_dog_form/hooks/use-record-upload";
import type { DogFormInput, DogFormValues } from "~/routes/account_dog_form/schema";

/*===== Constants =====*/
// The photos are small prints taped into the file: a strip of tape with torn ends across each top, the tilts
// alternating, as the evaluation request's.
const TAPE =
  "pointer-events-none absolute -top-2 left-1/2 h-3.5 w-10 -translate-x-1/2 bg-foreground/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)]";
const PRINT_TILTS = ["-rotate-2", "rotate-[1.5deg]", "-rotate-1", "rotate-2"] as const;
const MAX_MB = MEDIA_MAX_BYTES / (1024 * 1024);

/*===== Items =====*/
/** One photo: already in the file (`done` from the start when editing), on its way up, or refused. */
type Item = {
  key: string;
  status: "uploading" | "done" | "error";
  name: string;
  /** Object URL of the picked photo while it uploads. */
  preview?: string;
  media?: Media;
  error?: string;
};

type Action =
  | { type: "add"; items: Item[] }
  | { type: "done"; key: string; media: Media }
  | { type: "fail"; key: string; error: string }
  | { type: "remove"; key: string };

// Every update is keyed, so uploads finishing in any order, or a photo removed mid-upload, can't clobber one another.
function reducer(items: Item[], action: Action): Item[] {
  switch (action.type) {
    case "add":
      return [...items, ...action.items];
    case "remove":
      return items.filter((item) => item.key !== action.key);
    case "done":
      return items.map((item) =>
        item.key === action.key ? { ...item, status: "done", preview: undefined, media: action.media } : item,
      );
    case "fail":
      return items.map((item) =>
        item.key === action.key ? { ...item, status: "error", preview: undefined, error: action.error } : item,
      );
  }
}

type PhotoListField = "vaccinationPhotoIds" | "medicalPhotoIds" | "tattooPhotoIds";

/*===== Record Photos Field =====*/
/**
 * A few photos for the dog's file (the vaccination card's pages, the vet's papers, the tattoo), up to `max`. Each file
 * uploads at once (`useRecordUpload`), in parallel; the form's field (`name`) holds only the ids of the photos that are
 * fully up, in the owner's order, and the save sends them. Editing starts from the dog's stored photos (`initial`).
 *
 * The photos are taped prints in a row, with the add tile (a dashed chalk frame, the file input's label) as the last
 * one while there is room; the whole field is also a drop target. A photo can be removed at any time, mid-upload too.
 * A refused file (too big, a HEIC, a failed upload) shows as a row under the prints until it is dismissed.
 * `onBusyChange` lets the form hold its save while something is still on its way.
 *
 * The field's `ref` is the file input, so the form can move focus here when the server refuses the list.
 */
export function RecordPhotosField({
  name,
  label,
  hint,
  max,
  initial,
  onBusyChange,
}: {
  name: PhotoListField;
  label: string;
  hint: string;
  max: number;
  initial: readonly Media[];
  onBusyChange: (busy: boolean) => void;
}) {
  const baseId = useId();
  const { control } = useFormContext<DogFormInput, unknown, DogFormValues>();
  // `attachInput` is the field's ref callback: the form focuses the file input through it.
  const {
    field: { value: fieldValue, onChange: setIds, ref: attachInput },
    fieldState,
  } = useController({ name, control });
  const [items, dispatch] = useReducer(reducer, initial, (photos): Item[] =>
    photos.map((media) => ({ key: media.id, status: "done", name: "", media })),
  );
  const [dragging, setDragging] = useState(false);
  const nextKey = useRef(0);
  const previews = useRef(new Set<string>());
  const recordUpload = useRecordUpload();

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
  const ids = items.flatMap((item) => (item.media ? [item.media.id] : []));
  const idsKey = ids.join("|");
  const busy = items.some((item) => item.status === "uploading");

  // Effect events, so the form's fresh callbacks on every render don't re-run the effects.
  const report = useEffectEvent((next: string[]) => {
    const current: string[] = fieldValue ?? [];
    if (current.join("|") !== next.join("|")) setIds(next);
  });
  const reportBusy = useEffectEvent(onBusyChange);

  useEffect(() => {
    report(idsKey ? idsKey.split("|") : []);
  }, [idsKey]);

  useEffect(() => {
    reportBusy(busy);
  }, [busy]);

  /*------ Picking Files ------*/
  const addFiles = (files: File[]) => {
    // Counted from the list as of this render; refused rows make room again.
    let count = items.filter((item) => item.status !== "error").length;
    const added: Item[] = [];

    for (const file of files) {
      const key = `${baseId}-${nextKey.current++}`;
      const base = { key, name: file.name };
      if (count >= max) {
        added.push({ ...base, status: "error", error: m.account_dog_form_record_max({ count: formatNumber(max) }) });
      } else if (file.size > MEDIA_MAX_BYTES) {
        added.push({
          ...base,
          status: "error",
          error: m.account_dog_form_photo_too_big({ max: formatNumber(MAX_MB) }),
        });
      } else {
        count += 1;
        const preview = URL.createObjectURL(file);
        previews.current.add(preview);
        added.push({ ...base, status: "uploading", preview });
        recordUpload.upload({ key, file }).then(
          (media) => {
            revokePreview(preview);
            dispatch({ type: "done", key, media });
          },
          (error: Error) => {
            revokePreview(preview);
            // A photo removed mid-upload aborts its request; its row is already gone.
            if (error.name === "AbortError") return;
            dispatch({ type: "fail", key, error: error.message });
          },
        );
      }
    }

    if (added.length) dispatch({ type: "add", items: added });
  };

  const remove = (item: Item) => {
    if (item.status === "uploading") recordUpload.cancel(item.key);
    revokePreview(item.preview);
    dispatch({ type: "remove", key: item.key });
  };

  const photos = items.filter((item) => item.status !== "error");
  const problems = items.filter((item) => item.status === "error");
  const full = photos.length >= max;

  const hintId = `${baseId}-hint`;
  const inputId = `${baseId}-input`;
  const errorId = `${baseId}-error`;
  const serverError = fieldState.error?.message;

  return (
    <fieldset aria-describedby={hintId} className="flex min-w-0 flex-col gap-3">
      {/*===== Label =====*/}
      <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-bold">
        <span>
          {label} <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
        </span>
        {max > 1 && (
          <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            {m.account_dog_form_record_count({ count: formatNumber(photos.length), max: formatNumber(max) })}
          </span>
        )}
      </legend>
      <p id={hintId} className="-mt-2 text-sm text-pretty text-muted-foreground">
        {hint}
      </p>

      {/* Dropping files is a mouse shortcut for the file input, which keyboards and screen readers use. */}
      <div
        role="presentation"
        className={cn(
          "rounded-2xl transition-colors",
          dragging && !full && "bg-primary/5 outline-2 outline-offset-4 outline-primary/60 outline-dashed",
        )}
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
        {/*===== Prints =====*/}
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5 pt-2 sm:grid-cols-4">
          {photos.map((item, index) => (
            <li key={item.key} className={cn("answer-in relative", PRINT_TILTS[index % PRINT_TILTS.length])}>
              <div className="rounded-[3px] bg-foreground p-1 shadow-[0_10px_22px_-10px_rgb(0_0_0/0.95)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-sunken">
                  {item.media ? (
                    <MediaImage
                      media={item.media}
                      variant="thumb"
                      alt={m.account_dog_form_record_photo_alt({ label, number: formatNumber(index + 1) })}
                      className="size-full object-cover"
                    />
                  ) : (
                    <>
                      {item.preview && <img src={item.preview} alt="" className="size-full object-cover opacity-50" />}
                      <span className="absolute inset-0 grid place-items-center">
                        <Spinner
                          aria-label={m.account_dog_form_photo_uploading_aria()}
                          className="size-6 text-foreground"
                        />
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span aria-hidden className={TAPE} />
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label={m.account_dog_form_record_remove({ label, number: formatNumber(index + 1) })}
                onClick={() => remove(item)}
                className="absolute -end-3 -top-3 rounded-full border border-foreground/20 bg-background hover:bg-muted"
              >
                <XIcon aria-hidden className="size-4" />
              </Button>
            </li>
          ))}

          {/*------ Add Tile ------*/}
          {/* Kept in the DOM when full (only hidden), so the form can still focus the input for a server message. */}
          <li className={cn("pt-1", full && "sr-only")}>
            <label
              htmlFor={inputId}
              className={cn(
                "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-1 text-center text-primary transition-colors",
                "border-foreground/25 hover:border-primary/60 hover:bg-primary/5 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                (fieldState.invalid || problems.length > 0) && "border-destructive/60",
              )}
            >
              <CameraIcon aria-hidden strokeWidth={1.5} className="size-6" />
              <span className="text-xs leading-tight font-bold">{m.account_dog_form_photo_add()}</span>
              <input
                ref={attachInput}
                id={inputId}
                type="file"
                multiple={max > 1}
                accept={MEDIA_ACCEPTED_TYPES}
                aria-label={label}
                aria-describedby={serverError ? `${hintId} ${errorId}` : hintId}
                aria-invalid={serverError ? true : undefined}
                disabled={full}
                className="sr-only"
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  // Lets the same file be picked again after removing it.
                  event.target.value = "";
                }}
              />
            </label>
          </li>
        </ul>
      </div>

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
              <span className="text-pretty text-destructive">{item.error}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(item)}
              aria-label={m.account_dog_form_record_dismiss_named({ name: item.name })}
            >
              {m.account_dog_form_record_dismiss()}
            </Button>
          </li>
        ))}
      </ul>

      {/*===== Server Message =====*/}
      {serverError && (
        <p key={serverError} id={errorId} role="alert" className="answer-in text-sm text-pretty text-destructive">
          {serverError}
        </p>
      )}
    </fieldset>
  );
}
