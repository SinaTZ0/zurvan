import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Send every route with the first page. With lazy discovery, links rendered right after a client navigation
  // (like the course cards) prefetch before their route is known, match the 404 route, and prefetch its code instead.
  routeDiscovery: { mode: "initial" },
} satisfies Config;
