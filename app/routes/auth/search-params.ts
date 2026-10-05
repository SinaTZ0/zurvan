import { parseAsStringLiteral } from "nuqs/server";

export const authTabs = ["login", "signup"] as const;

export type AuthTab = (typeof authTabs)[number];

/*===== Parsers =====*/
// UI-only: no loader reads the tab, so switching it doesn't revalidate. `?tab=signup` makes the
// sign-up form linkable.
export const authSearchParams = {
  tab: parseAsStringLiteral(authTabs).withDefault("login").withOptions({ shallow: true }),
};
