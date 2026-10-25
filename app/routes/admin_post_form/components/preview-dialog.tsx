import { cn } from "cn";
import { XIcon } from "lucide-react";

import { PostArticle } from "~/components/blog/post-article";
import { Button } from "~/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import type { BlogPost } from "~/orpc/blog/contract";
import { INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

/*===== Preview Dialog =====*/
/**
 * «پیش‌نمایش»: the article as a reader will meet it, full screen over the form, rendered by the public page's own
 * template (`PostArticle`) from the unsaved values, so it is true by construction. Its links don't navigate
 * (`preview`), so nothing typed is lost. A band at the top names it and closes it; once English is written, two
 * pills switch the article between the two languages (the English one reads left to right).
 *
 * The page's own labels (the date, the reading time, the closing card's words) come from the template in the Admin's
 * language, so the English preview shows her English text inside the Persian page's frame.
 */
export function PreviewDialog({
  open,
  onOpenChange,
  post,
  language,
  hasEnglish,
  onLanguageChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost;
  language: "fa" | "en";
  /** Some English is written, so the English preview is worth a switch. */
  hasEnglish: boolean;
  onLanguageChange: (language: "fa" | "en") => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "start-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-background p-0 ring-0 sm:max-w-none rtl:translate-x-0",
        )}
      >
        {/*===== Band =====*/}
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-foreground/15 bg-card/95 px-4 py-2.5 backdrop-blur-md sm:px-6">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold">پیش‌نمایش</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              همون‌طوری که خواننده می‌بینه؛ هنوز ذخیره نشده و پیوندهاش جایی نمی‌رن.
            </DialogDescription>
          </div>

          {hasEnglish && (
            <fieldset className="flex gap-1 rounded-full border border-foreground/15 p-1">
              <legend className="sr-only">زبان پیش‌نمایش</legend>
              {(["fa", "en"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={language === option}
                  onClick={() => onLanguageChange(option)}
                  className={cn(
                    "h-9 rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    "transition-[background-color,color] duration-200 motion-reduce:transition-none",
                    language === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option === "fa" ? "فارسی" : "انگلیسی"}
                </button>
              ))}
            </fieldset>
          )}

          <DialogClose
            render={
              <Button type="button" variant="outline" className={cn(INK_OUTLINE, "h-10")}>
                <XIcon aria-hidden />
                بستن
              </Button>
            }
          />
        </div>

        {/*===== The Article =====*/}
        <div
          key={language}
          dir={language === "en" ? "ltr" : "rtl"}
          lang={language}
          className="answer-in min-h-0 flex-1 overflow-y-auto overscroll-contain paper-grain"
        >
          <PostArticle post={post} preview />
        </div>
      </DialogContent>
    </Dialog>
  );
}
