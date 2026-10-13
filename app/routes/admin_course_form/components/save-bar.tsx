import { cn } from "cn";

import { FormAlert } from "~/components/form-alert";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

/*===== Save Bar =====*/
/**
 * The alert for what the server said that belongs to no field, then «ذخیره» and «انصراف». On phones it sticks to the
 * bottom of the screen above the Admin's tab bar (`bottom-16`, the bar is 4rem tall); from `lg` the tabs give way to
 * the rail and the bar sits in the flow after the last section.
 */
export function SaveBar({
  isNew,
  pending,
  uploading,
  message,
  className,
}: {
  isNew: boolean;
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
        "sticky bottom-16 z-10 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none",
        className,
      )}
    >
      <FormAlert message={message} />
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending || uploading} className="flex-1 sm:flex-none sm:px-10">
          {pending && <Spinner aria-hidden data-icon="inline-start" />}
          {isNew ? "ساخت دوره" : "ذخیره"}
        </Button>
        <Link to="/admin/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
          انصراف
        </Link>
      </div>
    </div>
  );
}
