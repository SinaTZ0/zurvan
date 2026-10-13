import { PersonMenu, type PersonMenuLink } from "~/components/person-menu";
import { PROFILE_LINK } from "~/lib/account-links";
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
  // Settings are for customers and partners; the Admin's own area will carry his.
  const settings = viewer.role === "admin" ? [] : [PROFILE_LINK];
  const links: readonly PersonMenuLink[] = isCustomer
    ? [...CUSTOMER_MENU_LINKS, ...settings]
    : // A partner or the Admin has a panel to go to (`homePath`); the Admin's menu holds no settings.
      [...(viewer.homePath ? [{ label: "پنل من", to: viewer.homePath }] : []), ...settings];

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
