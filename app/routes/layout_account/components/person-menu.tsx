import { ChevronDownIcon, LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { BOTTOM_TABS_FROM, type DeskExitLink, type DeskNavItem } from "~/routes/layout_account/account-nav";
import { useSignOut } from "~/routes/layout_account/hooks/use-sign-out";

/*===== Person Menu =====*/
/**
 * The signed-in person: their initial and first name, opening a menu with their number and «خروج». On phones, while
 * there are too few sections for a bottom tab bar, the menu also lists the sections.
 */
export function PersonMenu({
  firstName,
  phoneNumber,
  roleLabel,
  navItems,
  exitLink,
}: {
  firstName: string;
  phoneNumber: string | null;
  /** Shown under the name where the role isn't obvious, e.g. «مربی ارشد» in the trainer area. */
  roleLabel?: string;
  navItems: readonly DeskNavItem[];
  exitLink: DeskExitLink;
}) {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const sectionsInMenu = navItems.length < BOTTOM_TABS_FROM;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`حساب ${firstName}`}
        className="flex h-11 items-center gap-2 rounded-full border border-border bg-card ps-1 pe-3 text-sm font-bold transition-colors outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/40"
      >
        {/* The person's initial, set like the dog tags' engraving so the two read as one family. */}
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-full border border-primary/40 font-display text-base text-primary"
        >
          {Array.from(firstName)[0]}
        </span>
        <span className="hidden sm:inline">{firstName}</span>
        <ChevronDownIcon aria-hidden strokeWidth={1.7} className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <span className="block text-sm font-bold text-foreground">{firstName}</span>
            {roleLabel && <span className="block text-xs text-muted-foreground">{roleLabel}</span>}
            {phoneNumber && (
              <span dir="ltr" className="block text-end text-xs text-muted-foreground tabular-nums">
                {phoneNumber}
              </span>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {/*------ Sections (phones) ------*/}
        {sectionsInMenu && (
          <div className="lg:hidden">
            <DropdownMenuSeparator />
            {navItems.map((item) => (
              <DropdownMenuItem
                key={item.to}
                className="px-2 py-2 text-sm"
                onClick={() => void navigate(item.to, { viewTransition: true })}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              className="px-2 py-2 text-sm"
              onClick={() => void navigate(exitLink.to, { viewTransition: true })}
            >
              {exitLink.label}
            </DropdownMenuItem>
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="px-2 py-2 text-sm"
          disabled={signOut.isPending}
          onClick={() => signOut.mutate()}
        >
          <LogOutIcon aria-hidden strokeWidth={1.7} className="rtl:-scale-x-100" />
          خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
