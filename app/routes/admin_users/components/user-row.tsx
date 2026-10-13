import { cn } from "cn";

import { CustomerContact } from "~/components/customer-contact";
import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminUser } from "~/orpc/user/contract";
import { BlockedChip, RoleChip } from "~/routes/admin_users/components/user-chips";

/*===== User Row =====*/
/**
 * One person on the roll. The name is a stretched link that opens the dialog (`href` keeps it a real link for a new tab
 * and before hydration); the phone link sits above it (`relative z-10`) so it stays tappable.
 *
 * A blocked person is drawn like a lost lead: a dashed border, no card fill, the disc and name dimmed, and the
 * «مسدود» chip. There is no gold anywhere in the row, hover included.
 *
 * Phones get two lines (the name and chips, then the phone and the dates under); from `xl` it is one line. The `xl`
 * switch is not `lg` because beside the rail the content at 1024 is only about 740px wide.
 */
export function UserRow({ user, href, onOpen }: { user: AdminUser; href: string; onOpen: () => void }) {
  const blocked = user.status === "blocked";

  return (
    <li
      className={cn(
        "group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        "[grid-template-areas:'disc_name'_'._meta']",
        "xl:grid-cols-[auto_minmax(0,5fr)_minmax(0,3fr)_minmax(0,6fr)] xl:gap-x-4 xl:[grid-template-areas:'disc_name_who_dates']",
        blocked
          ? "border-dashed border-border bg-transparent hover:bg-muted/30"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      {/*===== Initial Disc =====*/}
      <span
        aria-hidden
        className={cn(
          "grid size-10 place-items-center rounded-full bg-muted text-base font-extrabold text-foreground [grid-area:disc]",
          blocked && "opacity-60",
        )}
      >
        {Array.from(user.firstName)[0] ?? "؟"}
      </span>

      {/*===== Name and Chips =====*/}
      <div className="flex min-w-0 items-center gap-2 [grid-area:name]">
        <Link
          to={href}
          onClick={(event) => {
            // A plain click opens the dialog in place (a shallow URL change, no loader run); a new-tab click keeps the
            // browser's own behaviour.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onOpen();
          }}
          className={cn(
            "min-w-0 truncate rounded-sm font-extrabold outline-none after:absolute after:inset-0 after:rounded-2xl",
            blocked && "opacity-60",
          )}
        >
          <bdi>{user.name}</bdi>
        </Link>
        <RoleChip role={user.role} />
        {blocked && <BlockedChip />}
      </div>

      {/*===== Phone and Dates =====*/}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 [grid-area:meta] xl:contents">
        {/* The name is already the row's link: hide the contact's own copy of it, keeping the call link. The gold hover
            of the shared contact link is turned off: this page has no gold but the selected pills. */}
        <div
          className={cn(
            "relative z-10 xl:[grid-area:who] [&_a]:min-h-10 [&_a]:hover:text-foreground xl:[&_a]:min-h-0",
            blocked && "opacity-70",
          )}
        >
          <CustomerContact name={user.name} phoneNumber={user.phoneNumber} className="[&>span:first-child]:hidden" />
        </div>

        <p className="text-xs text-muted-foreground xl:[grid-area:dates]">
          ثبت‌نام {formatJalaliTimestamp(user.createdAt)}
          <span aria-hidden> · </span>
          {user.lastLoginAt ? `آخرین ورود ${formatJalaliTimestamp(user.lastLoginAt)}` : "هنوز وارد نشده"}
          {user.role === "customer" && user.dogCount > 0 && (
            <>
              <span aria-hidden> · </span>
              {formatNumberFa(user.dogCount)} سگ
            </>
          )}
        </p>
      </div>
    </li>
  );
}
