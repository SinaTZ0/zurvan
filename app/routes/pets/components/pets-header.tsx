import { LogOutIcon } from "lucide-react";

import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

type PetsHeaderProps = {
  onSignOut: () => void;
  isSigningOut: boolean;
};

/*===== Header =====*/
export function PetsHeader({ onSignOut, isSigningOut }: PetsHeaderProps) {
  return (
    // Desktop gets a full-width bar under the header; phones keep it borderless to save height.
    <header className="lg:border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 lg:px-8 lg:pb-4">
        <img
          src="/logo-h.png"
          alt="زروان"
          width={316}
          height={106}
          className="h-11 w-auto dark:opacity-90 dark:brightness-0 dark:invert"
        />
        {/* In RTL the last item sits leftmost, so the theme toggle is the top-left control. */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={onSignOut} disabled={isSigningOut}>
            {isSigningOut ? (
              <Spinner data-icon="inline-start" />
            ) : (
              // Mirrored so the arrow points out of the page in RTL.
              <LogOutIcon data-icon="inline-start" strokeWidth={1.7} className="-scale-x-100" />
            )}
            خروج
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
