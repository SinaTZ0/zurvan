import { useSyncExternalStore } from "react";

/*===== Install Prompt =====*/
// The site asks to be installed as an app with its own banner (`InstallBanner`, docs/mobile-app.md) instead of Chrome's
// mini-infobar. Chrome announces that the site can be installed with `beforeinstallprompt`, often before React has
// hydrated, so the event is caught here as soon as the client bundle runs (`captureInstallPrompt` in `app/root.tsx`) and
// kept for the banner. Chrome doesn't fire it while the app is installed, so on Android "the event came" also means "not
// installed". Safari never fires it: an iPhone gets instructions instead (`isIosInstallable`).

/** Chrome's install event (not in the DOM typings). `prompt()` opens its install dialog and works once per event. */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function setDeferredPrompt(event: InstallPromptEvent | null) {
  deferredPrompt = event;
  for (const listener of listeners) listener();
}

/**
 * Starts listening for Chrome's install event; call once, at the client bundle's start. `preventDefault` keeps Chrome's
 * own mini-infobar away, so a phone sees one banner, ours, under our "ask again in 30 days" rule. `appinstalled` drops
 * the kept event, which hides the banner.
 */
export function captureInstallPrompt() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setDeferredPrompt(event as InstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => setDeferredPrompt(null));
}

/** Chrome's kept install event, or `null` (none yet, already used, the app is installed, or not Chrome). */
export function useInstallPrompt() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => deferredPrompt,
    () => null,
  );
}

/**
 * Opens Chrome's install dialog. The event can't be reused afterwards, so it is dropped whatever the answer (Chrome fires
 * a new one on a later page load if the app still isn't installed).
 * @returns Whether the person installed it.
 */
export async function promptInstall(event: InstallPromptEvent) {
  setDeferredPrompt(null);
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}

/*===== Where We Are =====*/
/**
 * Whether this page is running inside the installed app: the home-screen PWA (any display mode but the browser's),
 * iOS's home-screen app, or the Android app (the TWA, which opens the first page with an `android-app://` referrer).
 */
export function isRunningAsApp() {
  return (
    window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

/**
 * Whether this is an iPhone or iPad browser that can add the site to the home screen (Safari, and since iOS 16.4 the
 * others, from the Share menu). An app's in-app browser (a plain WebView) can't, and its user agent has no `Safari/`.
 * An iPad asking for the desktop site says it is a Mac, and gives itself away by its touch points.
 */
export function isIosInstallable() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios && /Safari\//.test(ua);
}

/**
 * Whether the Android app (`ir.zurvann.app`, named in the manifest's `related_applications`) is on this phone. Chrome on
 * Android only; anywhere else, or if the check fails, it answers `false`.
 */
export async function isAndroidAppInstalled() {
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<{ id?: string }[]> };
  if (!nav.getInstalledRelatedApps) return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return apps.length > 0;
  } catch {
    return false;
  }
}

/*===== Asking Again =====*/
// The banner's dismissal is remembered in this browser only; internal identifiers keep the `zurvan` name (CLAUDE.md).
const DISMISSED_AT_KEY = "zurvan-install-dismissed-at";

/** How long a closed banner stays away: the owner's "every 20 or 30 days" (2026-10-25). */
const ASK_AGAIN_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/** Whether the banner was closed in the last 30 days. Storage can be blocked (a private window): then it may ask. */
export function wasDismissedRecently() {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY));
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < ASK_AGAIN_AFTER_MS;
  } catch {
    return false;
  }
}

/** Remembers that the banner was closed (or Chrome's dialog cancelled), so it stays away for 30 days. */
export function rememberDismissal() {
  try {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    // Storage is blocked: the banner may come back on the next visit, nothing worse.
  }
}
