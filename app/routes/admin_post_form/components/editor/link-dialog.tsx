import { cn } from "cn";
import { Unlink2Icon } from "lucide-react";
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
import { isSafeHref } from "~/lib/blog-body";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_post_form/components/field-parts";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE, INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

const URL_MESSAGE =
  "این نشانی باز نمی‌شه. نشانی کامل یه سایت رو بنویس (با https)، یا نشانی یه صفحه‌ی همین سایت که با «/» شروع می‌شه.";

/**
 * What she typed as an address the article can carry: a bare domain («instagram.com/…») gets `https://`, and the
 * result must pass `isSafeHref` (the web, mail, phone, or this site's own paths).
 *
 * @returns null when it still isn't one.
 */
export function toSafeUrl(raw: string): string | null {
  const typed = raw.trim();
  if (typed === "") return null;
  const withScheme = /^[\p{L}\d-]+(\.[\p{L}\d-]+)+(?:[/?#]|$)/u.test(typed) ? `https://${typed}` : typed;
  return isSafeHref(withScheme) ? withScheme : null;
}

/*===== Link Dialog =====*/
/**
 * «پیوند»: the address for the words she selected, checked before it goes in (the same rule the server applies). With
 * nothing selected it also asks for the link's words, so a link can be typed in one go. On a link she is already in,
 * it opens with its address and offers to remove it.
 *
 * The page remounts it for each opening, so it starts from `initialUrl`.
 */
export function LinkDialog({
  open,
  onOpenChange,
  initialUrl,
  editing,
  needsText,
  onApply,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl: string;
  /** The caret is in a link: the dialog changes it, and can remove it. */
  editing: boolean;
  /** Nothing is selected: the link's words are typed here. */
  needsText: boolean;
  onApply: (link: { url: string; text: string }) => void;
  onRemove: () => void;
}) {
  const urlId = useId();
  const textId = useId();
  // The first thing to type: the words when there are none, else the address.
  const textInput = useRef<HTMLInputElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState("");
  const [urlError, setUrlError] = useState<string | undefined>();
  const [textError, setTextError] = useState<string | undefined>();

  function apply(event: React.FormEvent) {
    event.preventDefault();
    // Inside the post form: this form's submit must not reach the form around the editor.
    event.stopPropagation();
    const safe = toSafeUrl(url);
    const words = text.trim();
    setUrlError(safe ? undefined : URL_MESSAGE);
    setTextError(needsText && words === "" ? "متن پیوند رو بنویس؛ همونی که توی نوشته دیده می‌شه." : undefined);
    if (!safe || (needsText && words === "")) return;
    onApply({ url: safe, text: words });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_PLATE, "gap-5")} initialFocus={needsText ? textInput : urlInput}>
        <form onSubmit={apply} noValidate className="contents">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE}>{editing ? "عوض کردن پیوند" : "پیوند"}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-pretty">
              پیوند بیرونی توی برگه‌ی تازه باز می‌شه؛ صفحه‌های خود سایت توی همون برگه.
            </DialogDescription>
          </DialogHeader>

          {needsText && (
            <Field data-invalid={!!textError} className="gap-2">
              <FieldLabel htmlFor={textId}>متن پیوند</FieldLabel>
              <Input
                ref={textInput}
                id={textId}
                autoComplete="off"
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="h-11 text-sm"
                aria-invalid={!!textError}
                aria-describedby={describedBy({ id: textId, error: !!textError })}
              />
              <FieldMessage id={textId} message={textError} />
            </Field>
          )}

          <Field data-invalid={!!urlError} className="gap-2">
            <FieldLabel htmlFor={urlId}>نشانی</FieldLabel>
            <Input
              ref={urlInput}
              id={urlId}
              dir="ltr"
              inputMode="url"
              autoComplete="off"
              placeholder="https://"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="h-11 text-sm"
              aria-invalid={!!urlError}
              aria-describedby={describedBy({ id: urlId, hint: true, error: !!urlError })}
            />
            <FieldHint id={urlId}>
              نشانی کامل، یا یه صفحه‌ی همین سایت مثل <bdi dir="ltr">/courses/house-manner</bdi>
            </FieldHint>
            <FieldMessage id={urlId} message={urlError} />
          </Field>

          <DialogFooter className={cn(DIALOG_FOOTER, "sm:justify-between")}>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive sm:me-auto"
                onClick={onRemove}
              >
                <Unlink2Icon aria-hidden />
                برداشتن پیوند
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" className={INK_OUTLINE} onClick={() => onOpenChange(false)}>
                انصراف
              </Button>
              <Button type="submit" variant="solid">
                {editing ? "ذخیره‌ی پیوند" : "گذاشتن پیوند"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
