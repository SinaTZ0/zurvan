import { cn } from "cn";
import { CheckCircle2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { formatFileSize } from "~/lib/file-format";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import {
  BEHAVIOR_VIDEO_ACCEPTED_TYPES,
  BEHAVIOR_VIDEO_MAX_COUNT,
  BEHAVIOR_VIDEO_MAX_BYTES,
} from "~/orpc/behavior-request/constants";
import type { VideoTile } from "~/routes/behavior_modification/hooks/use-video-upload";

/*===== Video Uploader =====*/
/**
 * Part 3: a dashed drop area on the sunken plate, and one tile per picked video. A tile shows the first frame, its name
 * and size, then its upload progress as a flat gold line, then a check. A rejected file keeps its tile with the server's
 * message in `destructive`, so it can be removed and replaced.
 */
export function VideoUploader({
  tiles,
  onAdd,
  onRemove,
  error,
}: {
  tiles: readonly VideoTile[];
  /** @returns How many files were refused because the limit was reached. */
  onAdd: (files: File[]) => number;
  onRemove: (localId: string) => void;
  error?: string | null;
}) {
  const [refusal, setRefusal] = useState<string | null>(null);
  const full = tiles.length >= BEHAVIOR_VIDEO_MAX_COUNT;

  function pick(files: File[]) {
    if (files.length === 0) return;
    const refused = onAdd(files);
    setRefusal(
      refused > 0
        ? `حداکثر ${formatNumberFa(BEHAVIOR_VIDEO_MAX_COUNT)} ویدیو می‌شود فرستاد. ${formatNumberFa(refused)} ویدیوی اضافه را نگرفتم.`
        : null,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!full && (
        <div
          className="group relative"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            pick(Array.from(event.dataTransfer.files));
          }}
        >
          <input
            id="behavior-video-input"
            type="file"
            multiple
            accept={BEHAVIOR_VIDEO_ACCEPTED_TYPES}
            className="peer sr-only"
            onChange={(event) => {
              pick(Array.from(event.currentTarget.files ?? []));
              // Cleared so that picking the same file again still fires a change.
              event.currentTarget.value = "";
            }}
          />
          <label
            htmlFor="behavior-video-input"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-sunken px-6 py-8 text-center transition-colors",
              "group-hover:border-primary/60 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
            )}
          >
            <UploadIcon aria-hidden strokeWidth={1.7} className="size-6 text-primary" />
            <span className="font-bold">ویدیو انتخاب کن یا اینجا رها کن</span>
            <span className="text-sm text-pretty text-muted-foreground">
              تا {formatNumberFa(BEHAVIOR_VIDEO_MAX_COUNT)} ویدیوی MP4 یا MOV، هرکدام تا{" "}
              {formatNumberFa(BEHAVIOR_VIDEO_MAX_BYTES / (1024 * 1024))} مگابایت
            </span>
          </label>
        </div>
      )}

      {refusal && <output className="block text-sm font-bold text-pretty text-destructive">{refusal}</output>}

      {tiles.length > 0 && (
        <ul className="flex flex-col gap-3">
          {tiles.map((tile) => (
            <VideoTileRow key={tile.localId} tile={tile} onRemove={() => onRemove(tile.localId)} />
          ))}
        </ul>
      )}

      <p className="text-sm text-pretty text-muted-foreground">
        فقط آرمان و مربی سگت ویدیوها را می‌بینند. از چند زاویه و از نزدیک بگیر.
      </p>
      {error && (
        <p role="alert" className="text-sm font-bold text-pretty text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/*===== Tile =====*/
function VideoTileRow({ tile, onRemove }: { tile: VideoTile; onRemove: () => void }) {
  const percent = Math.round(tile.progress * 100);

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="flex gap-4">
        {/* The first frame only: `preload="metadata"` fetches the header, not the clip. The fragment makes Safari draw it. */}
        <video
          aria-hidden
          src={`${tile.previewUrl}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          dir="ltr"
          className="aspect-video h-20 shrink-0 rounded-xl bg-sunken object-cover"
        />

        <p className="min-w-0 flex-1">
          <span className="block truncate font-bold" dir="auto" title={tile.file.name}>
            {tile.file.name}
          </span>
          <span className="block text-sm text-muted-foreground">{formatFileSize(tile.file.size)}</span>
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`حذف ${tile.file.name}`}
          className="shrink-0 self-start"
        >
          <Trash2Icon aria-hidden className="size-4" />
          حذف
        </Button>
      </div>

      {/*------ Status ------*/}
      {/* Under the whole row, not beside the thumbnail: a server message is a sentence and needs the full width. */}
      {tile.status === "uploading" && (
        <div className="flex flex-col gap-1">
          {/* The percentage under the line is what a screen reader gets; the line is for the eye. */}
          <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            در حال بارگذاری {toPersianDigits(String(percent))}٪
          </span>
        </div>
      )}

      {tile.status === "uploaded" && (
        <p className="flex items-center gap-2 text-sm font-bold">
          <CheckCircle2Icon aria-hidden className="size-4 text-success" />
          ارسال شد
        </p>
      )}

      {tile.status === "failed" && (
        <p role="alert" className="text-sm font-bold text-pretty text-destructive">
          {tile.error}
        </p>
      )}
    </li>
  );
}
