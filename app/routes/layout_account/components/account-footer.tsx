import { PhoneIcon } from "lucide-react";

import { Link } from "~/components/link";
import { CENTER_PHONE } from "~/lib/contact";

/*===== Account Footer =====*/
/** A thin last line instead of the storefront's footer: who to call, and the refund rules people look for here. */
export function AccountFooter() {
  return (
    <footer className="border-t border-foreground/10">
      <div className="site-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-sm text-muted-foreground">
        <a
          href={`tel:${CENTER_PHONE.tel}`}
          className="flex items-center gap-2 rounded-sm py-1 transition-colors hover:text-foreground"
        >
          <PhoneIcon aria-hidden strokeWidth={1.7} className="size-4 text-saffron" />
          سؤالی داری؟ زنگ بزن
          <span dir="ltr" className="font-bold text-foreground">
            {CENTER_PHONE.display}
          </span>
        </a>
        <Link to="/help/refunds" className="rounded-sm py-1 transition-colors hover:text-foreground">
          قوانین لغو و بازپرداخت
        </Link>
      </div>
    </footer>
  );
}
