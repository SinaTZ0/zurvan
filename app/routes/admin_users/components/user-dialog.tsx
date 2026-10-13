import { useRef, useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import type { AdminUser } from "~/orpc/user/contract";
import { DangerZone } from "~/routes/admin_users/components/danger-zone";
import { NameForm } from "~/routes/admin_users/components/name-form";
import { RoleChip, StatusChip } from "~/routes/admin_users/components/user-chips";
import { UserFacts } from "~/routes/admin_users/components/user-facts";

/*===== User Dialog =====*/
/**
 * One person in full: the name form, the facts that can't change, a link to where their things live, and the switch that
 * shuts the account. Opened by `?user=<id>` so Back closes it. A centred dialog on desktop, a full-width sheet anchored to
 * the bottom on phones (the stock dialog is centred, so the phone position is overridden here).
 *
 * The page finds the person in the whole list, so after a name save the dialog stays open on the fresh data.
 */
export function UserDialog({
  userId,
  user,
  onClose,
}: {
  /** From `?user=`; null means closed. */
  userId: string | null;
  /** The match for the id in the full list; null when the id is unknown (the page clears the param). */
  user: AdminUser | null;
  onClose: () => void;
}) {
  // While the dialog fades out the id is already gone from the URL: keep drawing the last person instead of an empty
  // body. Set during render (not in an effect) so there is no frame with stale content.
  const [last, setLast] = useState<AdminUser | null>(null);
  if (user !== null && last !== user) setLast(user);
  const current = userId === null ? last : user;

  // Focus lands on the dialog itself, not the first field: on a phone the keyboard would open over the very thing the
  // Admin came to read, and most visits only read or press the block button.
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={userId !== null && user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={popupRef}
        initialFocus={popupRef}
        className={
          // Phones: pinned to the bottom edge, full width, rounded on top only. `max-sm:translate-x-0` also needs its
          // `rtl:` twin because the stock dialog centres with `rtl:translate-x-1/2`.
          "max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 max-sm:start-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none sm:max-w-lg max-sm:rtl:translate-x-0"
        }
      >
        {current && <Body key={current.id} user={current} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

/*===== Body =====*/
function Body({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <>
      {/*===== Header (fixed) =====*/}
      {/* `pe-12` keeps the title clear of the close button the dialog draws at the end corner. */}
      <DialogHeader className="border-b border-border p-4 pe-12">
        <DialogTitle className="text-lg leading-snug font-extrabold text-balance">
          <bdi>{user.name}</bdi>
        </DialogTitle>
        <DialogDescription className="sr-only">اطلاعات و وضعیت حساب این کاربر</DialogDescription>
        <div className="flex flex-wrap items-center gap-2">
          <RoleChip role={user.role} />
          <StatusChip status={user.status} />
        </div>
      </DialogHeader>

      {/*===== Body (scrolling) =====*/}
      <div data-lenis-prevent className="flex min-h-0 flex-col gap-6 overflow-y-auto p-4">
        {/*------ Name ------*/}
        <NameForm user={user} onGone={onClose} />

        {/*------ Facts ------*/}
        <UserFacts user={user} />

        {/*------ Links by Role ------*/}
        {/* Plain strings, never another slice's serializer. */}
        {user.role === "customer" && user.phoneNumber !== null && (
          <Link
            to={`/admin/dogs?q=${encodeURIComponent(user.phoneNumber)}`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}
          >
            سگ‌هایش
          </Link>
        )}
        {user.role === "partner" && (
          <Link
            to={`/admin/partners?view=partners&partner=${encodeURIComponent(user.id)}`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}
          >
            در صفحه‌ی همکاران
          </Link>
        )}

        {/*------ Danger Zone ------*/}
        <DangerZone user={user} onDone={onClose} />
      </div>
    </>
  );
}
