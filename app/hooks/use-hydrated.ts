import { useSyncExternalStore } from "react";

/*===== Hydration Flag =====*/
/** `useSyncExternalStore` needs a subscription; whether we've hydrated never changes afterwards. */
const subscribeToNothing = () => () => {};

/**
 * `false` on the server and during the hydration render, `true` from the first client render after it. Use it to hold
 * back UI that depends on browser-only state (the localStorage cart): rendering it during hydration would not match the
 * server's HTML. Unlike a `useEffect` flag, it doesn't cost an extra render on a client-side navigation.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
