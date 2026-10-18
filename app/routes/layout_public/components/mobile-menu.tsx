import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { PROFILE_PATH } from "~/lib/account-links";
import { useSignOut } from "~/hooks/use-sign-out";
import { Button, buttonVariants } from "~/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { NAV_CTA, NAV_ITEMS } from "~/routes/layout_public/nav-items";
import type { Viewer } from "~/routes/layout_public/viewer";

/*===== Mobile Menu =====*/
/**
 * Below `lg`, the nav lives in a sheet that slides in from the menu button's side (the left, in RTL). The sheet opens
 * with the one main action, the free assessment, then the page links; its last block is the sign-in button for a
 * visitor, or «حساب من» and «خروج» for a signed-in `viewer`. Those are outline buttons: the sheet has one gold button.
 */
export function MobileMenu({ viewer }: { viewer: Viewer | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const signOut = useSignOut();

  // A customer's account is `/account`; a partner or the Admin has a link only once their panel exists.
  const accountPath = viewer?.role === "customer" ? "/account" : viewer?.homePath;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="منو" className="lg:hidden" />}>
        <MenuIcon strokeWidth={1.7} />
      </SheetTrigger>

      <SheetContent side="left" className="w-[85%] max-w-sm gap-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-lg font-extrabold">منو</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 pt-4">
          {/*------ The Main Action ------*/}
          <Link to={NAV_CTA.to} onClick={close} className={cn(buttonVariants({ size: "lg", className: "w-full" }))}>
            {NAV_CTA.label}
          </Link>

          {/*------ Links ------*/}
          <nav aria-label="منوی اصلی">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.to} className="border-b last:border-b-0">
                  <Link to={item.to} onClick={close} className="block py-3.5 text-base font-bold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/*------ Account ------*/}
          {viewer ? (
            <div className="flex flex-col gap-2">
              {accountPath && (
                <Link
                  to={accountPath}
                  onClick={close}
                  className={cn(buttonVariants({ variant: "outline", size: "lg", className: "w-full" }))}
                >
                  {viewer.role === "customer" ? "حساب من" : "پنل من"}
                </Link>
              )}
              {viewer.role !== "admin" && (
                <Link
                  to={PROFILE_PATH}
                  onClick={close}
                  className={cn(buttonVariants({ variant: "outline", size: "lg", className: "w-full" }))}
                >
                  تنظیمات حساب
                </Link>
              )}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={signOut.isPending}
                onClick={() => {
                  close();
                  signOut.mutate();
                }}
              >
                خروج
              </Button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={close}
              className={cn(buttonVariants({ variant: "outline", size: "lg", className: "w-full" }))}
            >
              ورود یا ثبت‌نام
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
