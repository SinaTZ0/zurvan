import { cn } from "cn";

import { FormAlert } from "~/components/form-alert";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { INK_OUTLINE } from "~/routes/admin_course_form/surfaces";

/*===== Save Bar =====*/
/**
 * The alert for what the server said that belongs to no field (it rises in), then «ذخیره» / «ساخت دوره» and «انصراف».
 *
 * - **Phones and tablets (below `lg`):** a floating plate that sticks above the Admin's tab bar, in its look
 *   (the card's grey, a hairline, blurred), at `--tab-bar-space` from the bottom: the bar's height, its gap from the
 *   screen's edge and the half-rem between them, so neither covers the other. At the form's end it rests in the flow.
 * - **From `lg`** (the tabs give way to the rail): in the flow after the last plate, under the slip's dashed tear.
 *
 * The save button is gold only when there is something to save (`dirty`); an unchanged edit can still be saved, from
 * the card-filled outline, beside «انصراف» in ink. It waits while a photo uploads (saving now would leave it out) and while the save runs.
 */
export function SaveBar({
  isNew,
  dirty,
  pending,
  uploading,
  message,
  className,
}: {
  isNew: boolean;
  /** Something differs from what was loaded. */
  dirty: boolean;
  pending: boolean;
  /** A photo is still uploading: saving now would leave it out. */
  uploading: boolean;
  message: string | undefined;
  /** Placement in the form's grid. */
  className?: string;
}) {
  return (
    <div
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
      <div className="flex gap-2 lg:gap-3">
        <Button
          type="submit"
          variant={dirty ? "solid" : "outline"}
          disabled={pending || uploading}
          className="h-11 flex-1 lg:flex-none lg:px-10"
        >
          {pending && <Spinner aria-hidden data-icon="inline-start" />}
          {isNew ? "ساخت دوره" : "ذخیره"}
        </Button>
        <Link
          to="/admin/courses"
          className={buttonVariants({ variant: "outline", className: cn("h-11 px-6", INK_OUTLINE) })}
        >
          انصراف
        </Link>
      </div>
      {uploading && <p className="px-2 text-xs text-muted-foreground lg:px-0">تا عکس بار نشده، ذخیره صبر می‌کنه.</p>}
    </div>
  );
}
