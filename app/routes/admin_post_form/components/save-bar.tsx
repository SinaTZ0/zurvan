import { cn } from "cn";
import { RadioIcon, SendIcon } from "lucide-react";

import { FormAlert } from "~/components/form-alert";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

/*===== Save Bar =====*/
/**
 * The course form's save bar, with the blog's two ways out of a draft: the alert for what the server said that
 * belongs to no field (it rises in), then «ذخیره», «ذخیره و انتشار» for a draft, and «انصراف».
 *
 * - **Phones and tablets (below `lg`):** a floating plate that sticks above the Admin's tab bar, at `--tab-bar-space`
 *   from the bottom. At the form's end it rests in the flow.
 * - **From `lg`:** in the flow after the last plate, under the slip's dashed tear.
 *
 * «ذخیره» is gold only when there is something to save (`dirty`). A published post has no publish button; the bar says
 * instead that a save changes the live page at once. Both buttons wait while a photo uploads and while a save runs.
 */
export function SaveBar({
  isNew,
  live,
  dirty,
  pending,
  publishing,
  uploading,
  message,
  onSaveAndPublish,
  className,
}: {
  isNew: boolean;
  /** The post is published: a save is public at once. */
  live: boolean;
  /** Something differs from what was loaded. */
  dirty: boolean;
  pending: boolean;
  /** The pending save is «ذخیره و انتشار» (its button shows the spinner). */
  publishing: boolean;
  /** A photo is still uploading: saving now would leave it out. */
  uploading: boolean;
  message: string | undefined;
  onSaveAndPublish: () => void;
  /** Placement in the form's grid. */
  className?: string;
}) {
  const locked = pending || uploading;

  return (
    <div
      // The editor keeps the caret's line clear of this bar while it floats (`CaretClearancePlugin`).
      data-post-save-bar
      className={cn(
        "sticky bottom-(--tab-bar-space) z-30 flex flex-col gap-2.5 rounded-[1.6rem] border border-foreground/15 bg-card/90 p-2 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.8)] backdrop-blur-md",
        "lg:static lg:z-auto lg:rounded-none lg:border-x-0 lg:border-b-0 lg:bg-transparent lg:px-0 lg:pt-5 lg:pb-0 lg:shadow-none lg:backdrop-blur-none",
        ADMIN_TEAR,
        // The tear is only the desktop's: on phones the floating plate keeps its solid hairline.
        "max-lg:-mx-1 max-lg:border-solid max-lg:border-foreground/15",
        className,
      )}
    >
      {message && (
        <div key={message} className="answer-in">
          <FormAlert message={message} />
        </div>
      )}
      {live && (
        // On a phone the header's line says it already, and the floating bar stays one row high.
        <p className="hidden items-center gap-2 text-sm leading-5 text-pretty text-muted-foreground lg:flex">
          <RadioIcon aria-hidden strokeWidth={1.8} className="size-4 shrink-0 text-foreground/70" />
          منتشرشده‌ست: هر ذخیره همون لحظه توی صفحه‌ی عمومی دیده می‌شه.
        </p>
      )}
      <div className="flex gap-2 lg:gap-3">
        <Button
          type="submit"
          variant={dirty ? "solid" : "outline"}
          disabled={locked}
          className="h-11 flex-1 lg:flex-none lg:px-10"
        >
          {pending && !publishing && <Spinner aria-hidden data-icon="inline-start" />}
          {isNew ? "ذخیره‌ی پیش‌نویس" : "ذخیره"}
        </Button>
        {!live && (
          <Button
            type="button"
            variant="outline"
            disabled={locked}
            onClick={onSaveAndPublish}
            className={cn(INK_OUTLINE, "h-11 flex-1 px-3 lg:flex-none lg:px-6")}
          >
            {publishing ? (
              <Spinner aria-hidden data-icon="inline-start" />
            ) : (
              <SendIcon aria-hidden data-icon="inline-start" className="rtl:-scale-x-100" />
            )}
            ذخیره و انتشار
          </Button>
        )}
        {/* On a phone the two saves need the width; the header's «بازگشت به وبلاگ» leaves the form there. */}
        <Link
          to="/admin/blog"
          className={buttonVariants({
            variant: "ghost",
            className: "h-11 px-4 text-muted-foreground max-sm:hidden lg:ms-auto",
          })}
        >
          انصراف
        </Link>
      </div>
      {uploading && <p className="px-2 text-xs text-muted-foreground lg:px-0">تا عکس بار نشده، ذخیره صبر می‌کنه.</p>}
    </div>
  );
}
