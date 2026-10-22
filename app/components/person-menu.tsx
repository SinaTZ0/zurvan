import { cn } from "cn";
import { ChevronDownIcon, LogOutIcon } from "lucide-react";

import { Link } from "~/components/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSignOut } from "~/hooks/use-sign-out";
import type { StaticRoutePath } from "~/lib/route-path";

/*===== Types =====*/
/** One link in the person menu. */
export type PersonMenuLink = {
  label: string;
  to: StaticRoutePath;
  /** Listed only below `lg`: the account header already shows it as a tab on desktop. */
  phonesOnly?: boolean;
};

/*===== Person Menu =====*/
/**
 * The signed-in person in a header: their initial and first name, opening a menu with their number, the links the
 * caller passes and «خروج». Shared by the account header and the storefront header, so signing out looks and behaves
 * the same in both.
 */
export function PersonMenu({
  firstName,
  phoneNumber,
  roleLabel,
  links,
}: {
  firstName: string;
  phoneNumber: string | null;
  /** Shown under the name where the role isn't obvious, e.g. «مربی ارشد». */
  roleLabel?: string;
  links: readonly PersonMenuLink[];
}) {
  const signOut = useSignOut();

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
        {/*------ Who ------*/}
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

        {/*------ Links ------*/}
        {links.length > 0 && <DropdownMenuSeparator className={cn(links.every((l) => l.phonesOnly) && "lg:hidden")} />}
        {links.map((link) => (
          <DropdownMenuItem
            key={link.to}
            className={cn("px-2 py-2 text-sm", link.phonesOnly && "lg:hidden")}
            render={<Link to={link.to} />}
          >
            {link.label}
          </DropdownMenuItem>
        ))}

        {/*------ Sign out ------*/}
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
