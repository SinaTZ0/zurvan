import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminUser } from "~/orpc/user/contract";
import { PhoneLink } from "~/routes/admin_users/components/phone-link";
import { ROLL_COLUMNS, ROLL_PADDING } from "~/routes/admin_users/components/roll-columns";
import { BlockedChip, RoleChip } from "~/routes/admin_users/components/user-chips";
import { UserDisc } from "~/routes/admin_users/components/user-disc";
import { describeLastLogin } from "~/routes/admin_users/dates";
import { useSettledChange } from "~/routes/admin_users/hooks/use-settled-change";
import { isNameless, spokenName } from "~/routes/admin_users/people";

/*===== Constants =====*/
// What dims on a blocked row: everything but the «مسدود» chip, so the chip is the one thing that stands out. The
// transition is the answer to a block (and its undo); a row drawn blocked from the start never runs it.
const DIMS =
  "transition-opacity duration-500 delay-100 group-data-blocked:opacity-45 motion-reduce:transition-none motion-reduce:delay-0";

/*===== User Row =====*/
/**
 * One person on the roll, a line in the plate. The name is a stretched link that opens the dialog (`href` keeps it a
 * real link for a new tab and before hydration); the number sits above it (`relative z-10`) so it stays a call.
 *
 * - **Below `xl`:** the disc, the name with its chips, and under it the number and «آخرین ورود» (from `sm` also the
 *   registration and the dogs or code). The whole row opens the dialog.
 * - **From `xl`:** one line in the roll's fixed tracks (`ROLL_COLUMNS`), under the plate's column head.
 *
 * **A blocked person** is dimmed inside a dashed frame with the «مسدود» chip, the vocabulary of Leads' lost row. When
 * the status changes under him the frame eases in (or out), the dimming follows and the chip is pressed in
 * (`au-chip-stamp`); a saved name flashes the row once (`au-flash`). Both wait while the person's own dialog is open
 * (`open`), so they play when he can see them.
 *
 * `rise` is the row's delay when the list just changed under a filter, a search or a page (`null` otherwise, and on
 * load). `exit` is set on a kept copy that is leaving the current status pill: it folds away after its answer.
 */
export function UserRow({
  user,
  href,
  partnerCode,
  open,
  rise,
  leaving,
  folding,
  onOpen,
}: {
  user: AdminUser;
  href: string;
  /** The partner's referral code, for a partner's row. */
  partnerCode: string | undefined;
  /** Whether this person's dialog is open over the roll. */
  open: boolean;
  rise: number | null;
  /** A kept copy that no longer belongs to the view: inert at once. */
  leaving: boolean;
  /** Its exit has started (the dialog has closed): it folds away. */
  folding: boolean;
  onOpen: () => void;
}) {
  const status = useSettledChange({ value: user.status, hold: open });
  const name = useSettledChange({ value: user.name, hold: open });
  const blocked = status.shown === "blocked";
  const nameless = isNameless(user);
  const spoken = spokenName(user);

  return (
    <li
      data-blocked={blocked || undefined}
      inert={leaving}
      className={cn(
        "group grid grid-rows-[1fr]",
        rise !== null && "answer-in",
        leaving && "au-leaving",
        folding && "au-fold",
      )}
      style={rise !== null ? ({ "--answer-delay": `${rise}s` } as React.CSSProperties) : undefined}
    >
      <div className={cn("min-h-0", folding && "overflow-hidden")}>
        <div
          className={cn(
            "relative grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 transition-colors xl:py-2.5",
            "[grid-template-areas:'disc_name_chev'_'disc_meta_chev'] xl:[grid-template-areas:'disc_name_phone_joined_last_extra_chev']",
            ROLL_COLUMNS,
            ROLL_PADDING,
            // The row lights the same way for the mouse and for the keyboard on its link.
            "hover:bg-foreground/[0.035] has-[[data-row-link]:focus-visible]:bg-foreground/[0.05] has-[[data-row-link]:focus-visible]:ring-2 has-[[data-row-link]:focus-visible]:ring-ring/60 has-[[data-row-link]:focus-visible]:ring-inset",
          )}
        >
          {/*===== Blocked Frame =====*/}
          {/* Inset from the hairlines, so the dashed line reads as this row's own edge. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-1.5 inset-y-1 rounded-2xl border border-dashed border-foreground/35 opacity-0 transition-opacity delay-100 duration-500 group-data-blocked:opacity-100 motion-reduce:transition-none motion-reduce:delay-0 sm:inset-x-2"
          />

          {/*===== Saved Name Flash =====*/}
          {name.changes > 0 && (
            <span
              key={name.changes}
              aria-hidden
              className="au-flash pointer-events-none absolute inset-0 bg-foreground/[0.08] opacity-0"
            />
          )}

          {/*===== Disc =====*/}
          <span className={cn("self-start [grid-area:disc] xl:self-auto", DIMS)}>
            <UserDisc user={user} />
          </span>

          {/*===== Name and Chips =====*/}
          <div className="flex min-w-0 items-center gap-2 [grid-area:name]">
            <Link
              to={href}
              data-row-link
              aria-label={nameless ? `بی‌نام، ${spoken}` : undefined}
              onClick={(event) => {
                // A plain click opens the dialog in place (a shallow URL change, no loader run); a new-tab click keeps
                // the browser's own behaviour.
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpen();
              }}
              className={cn(
                "min-w-0 truncate text-sm leading-6 outline-none after:absolute after:inset-0",
                nameless ? "text-muted-foreground" : "font-bold",
                DIMS,
              )}
            >
              {nameless ? "بی‌نام" : <bdi>{user.name}</bdi>}
            </Link>
            <span className={cn("shrink-0", DIMS)}>
              <RoleChip role={user.role} />
            </span>
            {user.isSelf && <span className="shrink-0 text-xs text-muted-foreground">خودت</span>}
            {blocked && <BlockedChip key={status.changes} className={cn(status.changes > 0 && "au-chip-stamp")} />}
          </div>

          {/*===== Number, Dates and Dogs =====*/}
          {/* A line under the name below `xl`, with the words the column head says from `xl` (kept for screen
              readers there). */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground [grid-area:meta] xl:contents">
            {/*------ Number ------*/}
            <span className={cn("relative z-10 min-w-0 xl:[grid-area:phone]", DIMS)}>
              {/* 40px to the finger below `xl`, without making the line taller. */}
              <PhoneLink phoneNumber={user.phoneNumber} label={spoken} className="-my-2 min-h-10 xl:my-0 xl:min-h-6" />
            </span>

            {/*------ Registered ------*/}
            <span className={cn("hidden sm:inline xl:[grid-area:joined]", DIMS)}>
              <span className="xl:sr-only">ثبت‌نام </span>
              {formatJalaliTimestamp(user.createdAt)}
            </span>

            {/*------ Last Sign-in ------*/}
            <span className={cn("xl:[grid-area:last]", DIMS)}>
              {user.lastLoginAt ? (
                <>
                  <span className="xl:sr-only">آخرین ورود </span>
                  <span className="text-foreground/80">{describeLastLogin({ moment: user.lastLoginAt })}</span>
                </>
              ) : (
                "هنوز وارد نشده"
              )}
            </span>

            {/*------ Dogs or Code ------*/}
            <span className={cn("hidden min-w-0 truncate sm:inline xl:[grid-area:extra]", DIMS)}>
              <Extra user={user} partnerCode={partnerCode} />
            </span>
          </div>

          {/*===== Chevron =====*/}
          <ChevronLeftIcon
            aria-hidden
            strokeWidth={1.7}
            className="hidden size-5 text-muted-foreground transition-[translate,color] duration-200 [grid-area:chev] group-hover:-translate-x-0.5 group-hover:text-foreground group-has-[[data-row-link]:focus-visible]:-translate-x-0.5 group-has-[[data-row-link]:focus-visible]:text-foreground motion-reduce:transition-none md:block"
          />
        </div>
      </div>
    </li>
  );
}

/*===== Extra =====*/
/** The last column: a customer's dogs, a partner's code; nothing for the Admin. */
function Extra({ user, partnerCode }: { user: AdminUser; partnerCode: string | undefined }) {
  if (user.role === "customer") {
    return user.dogCount > 0 ? (
      <span className="text-foreground/80">{formatNumberFa(user.dogCount)} سگ</span>
    ) : (
      "بدون سگ"
    );
  }
  if (user.role === "partner" && partnerCode) {
    return (
      <>
        کد{" "}
        <bdi dir="ltr" className="text-foreground/80">
          {partnerCode}
        </bdi>
      </>
    );
  }
  return null;
}
