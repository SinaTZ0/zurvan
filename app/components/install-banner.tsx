import { SquarePlus, Share, X } from "lucide-react";
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  isAndroidAppInstalled,
  isIosInstallable,
  isRunningAsApp,
  promptInstall,
  rememberDismissal,
  useInstallPrompt,
  wasDismissedRecently,
} from "~/lib/install-prompt";
import { m } from "~/paraglide/messages";

/*===== Timing =====*/
// Not on the first seconds of a visit: the person should have seen the page before the site asks for a place on their phone.
const SHOW_AFTER_MS = 10_000;

// A swipe up this far, or this fast, closes the banner (as Chrome's own does).
const SWIPE_CLOSE_OFFSET = 40;
const SWIPE_CLOSE_VELOCITY = 400;

/*===== Install Banner =====*/
/**
 * The "install the app" banner at the top of a phone screen, laid out like Chrome's own install popup (the app's icon,
 * its name and address, a text «نصب» button) in the site's colours; docs/mobile-app.md. In Chrome, «نصب» opens Chrome's
 * install dialog; on an iPhone, where Safari can't be asked, it opens the two steps of the Share menu.
 *
 * It comes only on a touch screen, outside the installed app, when the Android app isn't on the phone, and 30 days after
 * it was last closed (`wasDismissedRecently`). Closing it (×, a swipe up, or cancelling Chrome's dialog) starts the 30 days.
 * The storefront and account shells render it; the Admin and the sign-in page don't.
 */
export function InstallBanner() {
  const installPrompt = useInstallPrompt();
  const [ios, setIos] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [due, setDue] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  /*------ Whether to ask at all ------*/
  // Browser-only checks, so they run after hydration; the banner is never in the server's HTML.
  useEffect(() => {
    if (isRunningAsApp() || !window.matchMedia("(pointer: coarse)").matches || wasDismissedRecently()) return;
    let active = true;
    void isAndroidAppInstalled().then((installed) => {
      if (!active || installed) return;
      setIos(isIosInstallable());
      setAllowed(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDue(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const canInstall = ios || installPrompt !== null;
  const open = allowed && due && canInstall && !closed;

  /*------ Answers ------*/
  const close = () => {
    rememberDismissal();
    setClosed(true);
  };

  const install = async () => {
    if (ios) {
      setShowSteps(true);
      return;
    }
    if (!installPrompt) return;
    setClosed(true);
    const installed = await promptInstall(installPrompt);
    if (!installed) rememberDismissal();
  };

  return (
    <AnimatePresence>
      {open && <BannerCard ios={ios} showSteps={showSteps} onInstall={install} onClose={close} />}
    </AnimatePresence>
  );
}

/*===== Card =====*/
function BannerCard({
  ios,
  showSteps,
  onInstall,
  onClose,
}: {
  ios: boolean;
  showSteps: boolean;
  onInstall: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  // It slides down from above the screen's edge and leaves the same way; with reduced motion it only fades.
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: "-120%" };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -SWIPE_CLOSE_OFFSET || info.velocity.y < -SWIPE_CLOSE_VELOCITY) onClose();
  };

  return (
    // The wrapper lets taps through beside the card; the top inset keeps it clear of the camera strip in a browser too.
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <motion.section
        aria-labelledby={titleId}
        initial={hidden}
        animate={{ opacity: 1, y: 0 }}
        exit={hidden}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.7, bottom: 0.05 }}
        onDragEnd={onDragEnd}
        className="pointer-events-auto mx-auto max-w-md touch-pan-x rounded-3xl border border-foreground/10 bg-popover shadow-lg"
      >
        {/*------ The row, as Chrome draws it ------*/}
        <div className="flex items-center gap-3 py-3 ps-4 pe-2">
          <img
            src="/pwa/icon-192.png"
            alt=""
            width={192}
            height={192}
            className="size-12 shrink-0 rounded-xl"
            draggable={false}
          />
          <div className="min-w-0 flex-1">
            <p id={titleId} className="truncate text-base font-medium text-foreground">
              {m.pwa_install_title()}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              <bdi>{window.location.host}</bdi>
            </p>
          </div>
          {!showSteps && (
            <Button
              variant="ghost"
              onClick={onInstall}
              className="px-3 text-base font-semibold text-primary hover:text-primary-hover"
            >
              {m.pwa_install_action()}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={m.pwa_install_close()}
            className="text-muted-foreground"
          >
            <X />
          </Button>
        </div>

        {/*------ iPhone: the Share menu's two steps ------*/}
        {ios && showSteps && (
          <ol className="answer-in space-y-2 border-t border-foreground/10 px-4 py-3 text-sm text-foreground">
            <IosStep icon={<Share />}>{m.pwa_install_ios_share()}</IosStep>
            <IosStep icon={<SquarePlus />}>{m.pwa_install_ios_add()}</IosStep>
          </ol>
        )}
      </motion.section>
    </div>
  );
}

/** One step of the Share menu, with the icon iOS draws for it, so the person can find it on their own screen. */
function IosStep({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-primary [&_svg]:size-4.5"
      >
        {icon}
      </span>
      {children}
    </li>
  );
}
