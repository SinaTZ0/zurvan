import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { m } from "~/paraglide/messages";

/*===== Save Button =====*/
/**
 * A card's gold save button. Its icon cell holds three icons in one grid cell that turn into each other: the card's own
 * (idle), the spinner (saving) and a check (saved, for two seconds with «ثبت شد»), as the copy buttons on Dog Detail do.
 * While saving it is disabled, so nothing is sent twice. Right after a save the form is clean and the button disabled
 * again, but it stays fully opaque while it says «ثبت شد», so the answer reads.
 */
export function SaveButton({
  label,
  icon,
  isPending,
  isSaved,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  isPending: boolean;
  isSaved: boolean;
  disabled: boolean;
}) {
  const turn = "transition duration-300 ease-out motion-reduce:transition-none";
  const shown = isPending ? "pending" : isSaved ? "saved" : "idle";

  return (
    <Button
      type="submit"
      variant="solid"
      className={cn("h-12 w-full sm:w-auto sm:min-w-40 sm:self-start", isSaved && "disabled:opacity-100")}
      disabled={disabled || isPending}
    >
      <span aria-hidden className="grid place-items-center *:col-start-1 *:row-start-1">
        <span className={cn(turn, "grid place-items-center", shown !== "idle" && "scale-50 rotate-90 opacity-0")}>
          {icon}
        </span>
        <Spinner className={cn(turn, "size-5", shown !== "pending" && "scale-50 opacity-0")} />
        <CheckIcon strokeWidth={2.6} className={cn(turn, shown !== "saved" && "scale-50 -rotate-90 opacity-0")} />
      </span>
      {isPending ? m.account_profile_save_pending() : isSaved ? m.account_profile_save_done() : label}
    </Button>
  );
}
