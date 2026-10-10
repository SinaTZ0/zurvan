import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { SiteSearch } from "~/routes/layout_public/components/site-search";
import { NAV_ITEMS } from "~/routes/layout_public/nav-items";

/*===== Mobile Menu =====*/
/** Below `lg`, the nav and search live in a sheet that slides in from the menu button's side (the left, in RTL). */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
          <SiteSearch id="mobile-search" />

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

          <Link to="/auth" onClick={close} className={cn(buttonVariants({ size: "lg", className: "w-full" }))}>
            ورود یا ثبت‌نام
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
