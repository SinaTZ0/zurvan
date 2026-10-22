import { cn } from "cn";
import { useLocation } from "@tanstack/react-router";

import { BrandLogo } from "~/components/brand-logo";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { Button, buttonVariants } from "~/components/ui/button";
import { ADMIN_PLATE } from "~/lib/admin-plate";
import { CENTER, CENTER_PHONE } from "~/lib/contact";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";

/*===== Copy =====*/
// What happened, in the site's voice, and what to do next. A missing page and a broken one need different next steps:
// a wrong address has nothing to retry. Functions, so each is worded in the page's language when it renders.
const COPY = {
  missing: {
    title: () => m.shared_error_missing_title(),
    line: () => m.shared_error_missing_line(),
    tab: () => m.shared_error_missing_tab(),
  },
  broken: {
    title: () => m.shared_error_broken_title(),
    line: () => m.shared_error_broken_line(),
    tab: () => m.shared_error_broken_tab(),
  },
} as const;

/*===== Root Error Page =====*/
/**
 * The app's last error screen: what shows when something breaks above a page's own error boundary (a layout's loader,
 * the root itself). It renders outside every shell, so it brings its own header frame: the brand, which is also the
 * way home.
 *
 * Two looks, by where it happened. On the storefront and the account pages the `sorry` dog stands on a short path
 * beside the words, as on the pages' own error screens. Under `/admin` it follows the Admin's rule (the site's style,
 * not its story): no dog, the words on a plate, and the way back is the Overview.
 *
 * `details` is the error's message and stack, passed only in development; production never shows them.
 */
export function RootErrorPage({
  missing,
  details,
}: {
  /** A 404: the address points nowhere, so there is nothing to retry. */
  missing: boolean;
  details?: { message: string; stack?: string };
}) {
  const { pathname } = useLocation();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");
  const copy = missing ? COPY.missing : COPY.broken;
  // The Admin's way back stays Persian: the Admin has no English.
  const home = admin
    ? ({ to: "/admin", label: "برو به نمای کلی" } as const)
    : ({ to: "/", label: m.shared_error_home() } as const);

  /*------ Words ------*/
  const words = (
    <>
      <h1 className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>{copy.title()}</h1>
      <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">{copy.line()}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {missing ? (
          <Link to={home.to} className={buttonVariants({ variant: "solid", size: "lg" })}>
            {home.label}
          </Link>
        ) : (
          <>
            {/* A full reload: the error may have come from the layout or the root, which a client navigation keeps. */}
            <Button type="button" variant="solid" size="lg" onClick={() => window.location.reload()}>
              {m.shared_error_retry()}
            </Button>
            <Link to={home.to} className={buttonVariants({ variant: "outline", size: "lg" })}>
              {home.label}
            </Link>
          </>
        )}
      </div>

      {/* The customer's way out when it keeps failing; the Admin is the one they would call. */}
      {!admin && !missing && (
        <p className="mt-6 text-sm text-muted-foreground">
          {m.shared_error_call()}{" "}
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            dir="ltr"
            className="font-bold text-foreground underline-offset-4 hover:underline"
          >
            {CENTER_PHONE.display}
          </a>
        </p>
      )}

      {details && <DevDetails details={details} />}
    </>
  );

  return (
    <div className="flex min-h-svh flex-col">
      <title>{`${copy.tab()} | ${CENTER.name}`}</title>
      <meta name="robots" content="noindex" />

      {/*===== Header Frame =====*/}
      <header className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="flex h-16 items-center border-b border-foreground/25">
          <Link to={admin ? "/admin" : "/"} aria-label={m.shared_error_home_label()} className="rounded-full">
            <BrandLogo className="[&_img]:size-10" />
          </Link>
        </div>
      </header>

      {/*===== Body =====*/}
      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] content-center items-center gap-y-6 px-4 py-12 md:px-8 lg:grid-cols-12 lg:gap-x-12">
        {admin ? (
          <section className={cn(ADMIN_PLATE, "p-6 sm:p-8 lg:col-span-8")}>{words}</section>
        ) : (
          <>
            <section className="order-2 min-w-0 lg:order-1 lg:col-span-6">{words}</section>
            <SorryStage />
          </>
        )}
      </main>
    </div>
  );
}

/*===== Sorry Stage =====*/
/**
 * The `sorry` dog, ears back, on a short path between two bushes under the night sky (the pages' own error screens'
 * stage). Decorative. Physical sides: the pieces are tied to the picture, which faces right.
 */
function SorryStage() {
  return (
    <div aria-hidden className="relative order-1 h-48 lg:order-2 lg:col-span-6 lg:h-[22rem]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_50%_at_50%_78%,rgb(255_194_26/0.08),transparent)]" />
      <NightSky className="inset-x-[6%] top-1 h-16 lg:top-4 lg:h-28" />
      <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
      <MascotCut
        name="plants"
        className="lively-sway absolute bottom-[0.9rem] left-[18%] w-[15%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[13%]"
      />
      <MascotCut
        name="plants"
        className="lively-sway-2 absolute right-[18%] bottom-[0.9rem] w-[12%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-[10%]"
      />
      <MascotCut
        name="sorry"
        eager
        className="lively-breathe absolute bottom-[0.9rem] left-1/2 w-28 -translate-x-1/2 translate-y-[3%] lg:bottom-[1.2rem] lg:w-[14rem]"
      />
    </div>
  );
}

/*===== Dev Details =====*/
/** Development only: the error itself, folded, in the developer's direction. */
function DevDetails({ details }: { details: { message: string; stack?: string } }) {
  return (
    <details className="mt-8 rounded-2xl border border-dashed border-foreground/20 p-4 text-sm">
      <summary className="cursor-pointer font-bold">{m.shared_error_dev_details()}</summary>
      <div dir="ltr" className="mt-3 text-left">
        <p className="font-bold break-words">{details.message}</p>
        {details.stack && (
          <pre className="mt-3 max-h-80 overflow-auto text-xs leading-relaxed whitespace-pre text-muted-foreground">
            <code>{details.stack}</code>
          </pre>
        )}
      </div>
    </details>
  );
}
