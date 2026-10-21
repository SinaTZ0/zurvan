import { cn } from "cn";
import { UserRoundIcon } from "lucide-react";

import type { AdminUser } from "~/orpc/user/contract";
import { isNameless } from "~/routes/admin_users/people";

/*===== User Disc =====*/
/**
 * The round mark at the start of a person's row and dialog: the first letter of the name in Estedad on an ink disc, or
 * a person icon for someone who never wrote a name (a «؟» read as a mistake). No photo: people here have none.
 * Decorative, since the name beside it says the same.
 */
export function UserDisc({ user, className }: { user: AdminUser; className?: string }) {
  const nameless = isNameless(user);
  const initial = [...user.firstName.trim()][0] ?? [...user.lastName.trim()][0];

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.06] ring-1 ring-foreground/15",
        nameless ? "text-muted-foreground" : "font-display text-base font-extrabold text-foreground/90",
        className,
      )}
    >
      {nameless || initial === undefined ? <UserRoundIcon strokeWidth={1.6} className="size-[45%]" /> : initial}
    </span>
  );
}
