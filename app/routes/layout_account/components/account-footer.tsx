import { BrandEmblem } from "~/components/brand-emblem";
import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { PROFILE_LINK } from "~/lib/account-links";
import { CENTER_PHONE } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const LINK = `rounded text-foreground/70 transition-colors hover:text-foreground ${FOCUS}`;

const LINKS = [
  { label: "سؤال‌های پرتکرار", to: "/help" },
  { label: "تماس", to: "/contact" },
  { label: PROFILE_LINK.label, to: PROFILE_LINK.to },
];

/*===== Account Footer =====*/
/**
 * A short grained band instead of the storefront's tall footer: who lives here, the few links people look for, the
 * center's number, and the dog on the old phone standing on a strip of path inside the band. Below `lg` the bottom
 * padding clears the floating tab bar (`--tab-bar-space`).
 */
export function AccountFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-card paper-grain text-sm text-foreground/85">
      <style>{FOOTER_MOTION}</style>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 pt-8 pb-[calc(var(--tab-bar-space)+1rem)] md:px-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:pt-8 lg:pb-0">
        {/*------ The dog on the phone ------*/}
        {/* Phones put him above the links. Wide, he is the band's end-side scene and stands on its bottom edge. The
            bubble floats over his head with its tail aimed down at it, so its sides are physical (the picture's). */}
        <div className="relative order-first h-44 w-72 shrink-0 lg:order-last lg:h-48 lg:w-80">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_45%_60%_at_30%_85%,rgb(255_194_26/0.08),transparent)]" />
          <GroundStrip className="absolute inset-x-0 bottom-0 h-8 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] md:h-9" />
          <MascotCut name="plants" className="lively-sway absolute bottom-1 left-0 w-12 translate-y-[3%]" />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute bottom-1 left-[8.25rem] w-10 translate-y-[3%] -scale-x-100"
          />
          <MascotCut name="phone" className="lively-breathe absolute bottom-1.5 left-10 w-[6.5rem] translate-y-[3%]" />
          <ChalkBubble
            tail="left"
            className="account-footer-bubble lively-reveal-pop absolute top-0 left-[5.75rem] text-sm md:text-base"
          >
            الو؟ سؤالی داری؟
          </ChalkBubble>
        </div>

        {/*------ Who, links and the call ------*/}
        <div className="flex w-full min-w-0 flex-col items-center gap-5 pb-8 text-center lg:items-start lg:text-start">
          <div className="flex items-center gap-3">
            <BrandEmblem className="size-10" />
            <span className="font-display text-2xl font-black text-foreground">زروان</span>
          </div>
          <p className="max-w-md leading-7 text-pretty text-foreground/70">
            اینجا خونه‌ی سگ‌هاته؛ هر سؤالی بود، {HEAD_TRAINER.firstName} جواب می‌ده.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
            <nav aria-label="پیوندهای حساب">
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <a
              href={`tel:${CENTER_PHONE.tel}`}
              className={`flex items-center gap-2 rounded py-1 text-foreground/85 ${FOCUS}`}
            >
              {/* The bubble already asks «سؤالی داری؟»; the link only says how. */}
              زنگ بزن
              <span dir="ltr" className="font-bold text-primary tabular-nums hover:underline">
                {CENTER_PHONE.display}
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// The bubble's pop is the shared scroll reveal (`lively-reveal-pop`); this only sets where it grows from (its tail).
// Off under reduced motion with the shared rules, which only define the animation inside their own media query.
const FOOTER_MOTION = `
.account-footer-bubble { transform-origin: 1.75rem 100%; }
`;
