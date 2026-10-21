import { cn } from "cn";
import type { ReactNode } from "react";

import type { UserRole, UserStatus } from "~/lib/user-constants";

/*===== Constants =====*/
/** The three plain words; `USER_ROLE_LABELS` says «مدیر و مربی ارشد» for the Admin, which is too long for a chip. */
export const ROLE_WORDS: Record<UserRole, string> = {
  customer: "مشتری",
  partner: "همکار",
  admin: "مدیر",
};

/*===== Quiet Chip =====*/
/** An ink-outlined chip with no colour: a fact about the person (who, or that the account works), not a state to act on. */
function QuietChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-foreground/15 px-2.5 text-xs whitespace-nowrap text-muted-foreground">
      {children}
    </span>
  );
}

/*===== Role Chip =====*/
export function RoleChip({ role }: { role: UserRole }) {
  return <QuietChip>{ROLE_WORDS[role]}</QuietChip>;
}

/*===== Blocked Chip =====*/
/** The one loud thing on the roll: a person who can't come in. Destructive, never gold. */
export function BlockedChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border border-destructive/50 bg-destructive/10 px-2.5 text-xs font-bold whitespace-nowrap text-destructive",
        className,
      )}
    >
      مسدود
    </span>
  );
}

/*===== Status Chip =====*/
/** The dialog's header chip: «فعال» is quiet like the role, «مسدود» is the destructive one. */
export function StatusChip({ status }: { status: UserStatus }) {
  return status === "blocked" ? <BlockedChip /> : <QuietChip>فعال</QuietChip>;
}
