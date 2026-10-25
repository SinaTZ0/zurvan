import { cn } from "cn";
import { CheckIcon, CircleAlertIcon, ImageIcon, Trash2Icon } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { BLOG_FIGURE_ALT_MAX_LENGTH, BLOG_FIGURE_CAPTION_MAX_LENGTH } from "~/lib/blog-body";
import { formatNumberFa } from "~/lib/digits";
import { MEDIA_ACCEPTED_TYPES } from "~/orpc/media/constants";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_post_form/components/field-parts";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE, INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

/*===== Types =====*/
export type FigureDialogStatus = "uploading" | "ready" | "failed";

/*===== Figure Dialog =====*/
/**
 * An image's words. For a new image it opens as soon as the file is picked: the picture shows from memory, dimmed with
 * a spinner while it uploads, and she can write while it travels; «گذاشتن توی متن» waits for the upload. A failed upload
 * says why and offers another file. For an image already in the text it edits the description and the caption, or
 * removes the image.
 *
 * The description is required (the article's `alt`, and what a screen reader says); the caption is optional and shows
 * under the image. The page remounts the dialog for each opening, so it starts from `initialAlt` / `initialCaption`.
 */
export function FigureDialog({
  open,
  onOpenChange,
  mode,
  language,
  imageSrc,
  status,
  problem,
  initialAlt,
  initialCaption,
  onPickAnother,
  onSubmit,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "new" | "edit";
  /** The sheet's language: the words are typed in it. */
  language: "fa" | "en";
  imageSrc: string | null;
  status: FigureDialogStatus;
  problem: string | undefined;
  initialAlt: string;
  initialCaption: string;
  onPickAnother: (file: File) => void;
  onSubmit: (words: { alt: string; caption: string }) => void;
  onRemove: () => void;
}) {
  const altId = useId();
  const captionId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  // Her words are the first thing to write, while the picture uploads.
  const altInput = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState(initialAlt);
  const [caption, setCaption] = useState(initialCaption);
  const [altError, setAltError] = useState<string | undefined>();
  const [captionError, setCaptionError] = useState<string | undefined>();
  const dir = language === "en" ? "ltr" : "rtl";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    // Inside the post form: this form's submit must not reach the form around the editor.
    event.stopPropagation();
    const words = { alt: alt.trim(), caption: caption.trim() };
    const nextAltError =
      words.alt === ""
        ? "بنویس توی عکس چیه؛ برای کسی که عکس رو نمی‌بینه، و برای گوگل."
        : words.alt.length > BLOG_FIGURE_ALT_MAX_LENGTH
          ? `توضیح عکس حداکثر ${formatNumberFa(BLOG_FIGURE_ALT_MAX_LENGTH)} حرف می‌تونه باشه.`
          : undefined;
    const nextCaptionError =
      words.caption.length > BLOG_FIGURE_CAPTION_MAX_LENGTH
        ? `زیرنویس حداکثر ${formatNumberFa(BLOG_FIGURE_CAPTION_MAX_LENGTH)} حرف می‌تونه باشه.`
        : undefined;
    setAltError(nextAltError);
    setCaptionError(nextCaptionError);
    if (nextAltError || nextCaptionError || status !== "ready") return;
    onSubmit(words);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(DIALOG_PLATE, "max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto sm:max-w-lg")}
        initialFocus={altInput}
      >
        <form onSubmit={submit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE}>{mode === "new" ? "عکس تازه توی متن" : "عکس توی متن"}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-pretty">
              {mode === "new"
                ? "تا عکس بار می‌شه، توضیحش رو بنویس. سر جای مکان‌نما توی متن می‌شینه."
                : "توضیح و زیرنویسش رو عوض کن، یا از متن برش دار."}
            </DialogDescription>
          </DialogHeader>

          {/*------ The Picture ------*/}
          <div
            className={cn(
              "rounded-2xl bg-card p-1.5 ring-1",
              status === "failed" ? "ring-destructive/60" : "ring-foreground/15",
            )}
          >
            <div className="relative grid min-h-36 place-items-center overflow-hidden rounded-xl bg-sunken">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt=""
                  className={cn(
                    "max-h-64 w-auto max-w-full object-contain transition-opacity",
                    status === "uploading" && "opacity-45",
                  )}
                />
              ) : (
                <ImageIcon aria-hidden strokeWidth={1.5} className="size-7 text-muted-foreground" />
              )}
              {status === "uploading" && (
                <span className="absolute inset-0 grid place-items-center">
                  <Spinner aria-hidden className="size-7 text-foreground" />
                </span>
              )}
            </div>
          </div>

          {/*------ Upload State ------*/}
          {mode === "new" && (
            <div aria-live="polite" className="-mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              {status === "uploading" && <p className="text-muted-foreground">داره بار می‌شه…</p>}
              {status === "ready" && (
                <p key="ready" className="answer-in flex items-center gap-1.5 text-foreground/85">
                  <CheckIcon aria-hidden strokeWidth={2.2} className="size-4" />
                  عکس رسید.
                </p>
              )}
              {status === "failed" && (
                <p role="alert" className="flex items-start gap-1.5 text-destructive">
                  <CircleAlertIcon aria-hidden strokeWidth={1.8} className="mt-0.5 size-4 shrink-0" />
                  {problem}
                </p>
              )}
              {status !== "uploading" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={INK_OUTLINE}
                    onClick={() => fileInput.current?.click()}
                  >
                    یه عکس دیگه
                  </Button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={MEDIA_ACCEPTED_TYPES}
                    tabIndex={-1}
                    aria-hidden
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) onPickAnother(file);
                    }}
                  />
                </>
              )}
            </div>
          )}

          {/*------ Her Words ------*/}
          <Field data-invalid={!!altError} className="gap-2">
            <FieldLabel htmlFor={altId}>توضیح عکس</FieldLabel>
            <Input
              ref={altInput}
              id={altId}
              dir={dir}
              lang={language}
              autoComplete="off"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              className="h-11 text-sm"
              aria-invalid={!!altError}
              aria-describedby={describedBy({ id: altId, hint: true, error: !!altError })}
            />
            <FieldHint id={altId}>صحنه رو توی یه جمله بگو، مثلاً «توله‌ی مالینویز روی چمن، کنار قلاده‌اش».</FieldHint>
            <FieldMessage id={altId} message={altError} />
          </Field>

          <Field data-invalid={!!captionError} className="gap-2">
            <FieldLabel htmlFor={captionId}>زیرنویس (اختیاری)</FieldLabel>
            <Textarea
              id={captionId}
              dir={dir}
              lang={language}
              rows={2}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              className="min-h-20 text-sm"
              aria-invalid={!!captionError}
              aria-describedby={describedBy({ id: captionId, hint: true, error: !!captionError })}
            />
            <FieldHint id={captionId}>زیر عکس توی نوشته میاد.</FieldHint>
            <FieldMessage id={captionId} message={captionError} />
          </Field>

          {/*------ Buttons ------*/}
          <DialogFooter className={cn(DIALOG_FOOTER, "sm:justify-between")}>
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:me-auto"
                onClick={onRemove}
              >
                <Trash2Icon aria-hidden strokeWidth={1.75} />
                برداشتن از متن
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" className={INK_OUTLINE} onClick={() => onOpenChange(false)}>
                انصراف
              </Button>
              <Button type="submit" variant="solid" disabled={status !== "ready"}>
                {status === "uploading" && <Spinner aria-hidden data-icon="inline-start" />}
                {mode === "new" ? "گذاشتن توی متن" : "ذخیره"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
