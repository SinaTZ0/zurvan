import type { FileRoutesByTo } from "~/routeTree.gen";

/*===== Route Paths =====*/
/**
 * A page without params, as a literal route path. For link data kept in lists and props (menus, tabs, nav items):
 * a plain `string` would pass `Link`'s `to` check unchecked, this type keeps the check.
 */
export type StaticRoutePath = Exclude<keyof FileRoutesByTo, `${string}$${string}`>;
