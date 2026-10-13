import { PersonMenu, type PersonMenuLink } from "~/components/person-menu";
import { USER_ROLE_LABELS } from "~/lib/user-constants";
import { CartLink } from "~/routes/layout_public/components/cart-link";
import { CUSTOMER_MENU_LINKS } from "~/routes/layout_public/nav-items";
import type { Viewer } from "~/routes/layout_public/viewer";

/*===== Viewer Controls =====*/
/**
 * What replaces «ورود یا ثبت‌نام» for a signed-in person, on desktop and phones alike (it is small enough for both).
 * A customer gets the cart icon and a menu to their account pages; a partner or the Admin has no cart, only the menu.
 */
export function ViewerControls({ viewer }: { viewer: Viewer }) {
  const isCustomer = viewer.role === "customer";

  /*------ Menu links ------*/
  const links: readonly PersonMenuLink[] = isCustomer
    ? CUSTOMER_MENU_LINKS
    : // Their panels aren't built yet, so `homePath` is null and the menu holds only the name and «خروج».
      viewer.homePath
      ? [{ label: "پنل من", to: viewer.homePath }]
      : [];

  return (
    <>
      {isCustomer && <CartLink />}
      <PersonMenu
        firstName={viewer.firstName}
        phoneNumber={viewer.phoneNumber}
        roleLabel={isCustomer ? undefined : USER_ROLE_LABELS[viewer.role]}
        links={links}
      />
    </>
  );
}
