/*===== Service Worker =====*/
/**
 * Registers `public/sw.js`, which only stands in the offline page for a page that can't load (docs/mobile-app.md).
 *
 * Production builds only: in development a worker in front of Vite's dev server would answer for the dev server's own
 * pages and outlive restarts. A registration failure (a private window, a blocked worker) leaves the site as it is.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
