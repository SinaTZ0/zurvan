import { useLocation } from "@tanstack/react-router";
import { cn } from "cn";

import { BLOG_COLUMN } from "~/components/blog/column";
import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";

/*===== Post Missing =====*/
/**
 * What `/blog/<slug>` shows inside the shell when there is no post there (a 404: unknown, a draft, deleted, or on the
 * English site a post with no English) or when it failed to load. The dog has his nose to the path and lost the trail
 * by the signpost; the way on is the blog, and the free evaluation as ever. A failure's main button is a full reload of
 * the same address, so the server renders it afresh.
 *
 * Wide: words at the start, the stage at the end. Phones: the stage on top. His picture faces right, so the stage is
 * in logical sides and mirrored on the English pages (he sniffs along the path towards the words).
 */
export function PostMissing({ missing }: { missing: boolean }) {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section
      aria-labelledby="post-missing-title"
      className={cn(BLOG_COLUMN, "grid items-center gap-y-6 pt-section-sm lg:grid-cols-12 lg:gap-x-12")}
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-6">
        <h1 id="post-missing-title" className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>
          {missing ? m.blog_post_missing_title() : m.blog_post_broken_title()}
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          {missing ? m.blog_post_missing_text() : m.blog_post_broken_text()}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {missing ? (
            <Link to="/blog" className={buttonVariants({ variant: "solid", size: "lg" })}>
              {m.blog_post_all()}
            </Link>
          ) : (
            <a href={href} className={buttonVariants({ variant: "solid", size: "lg" })}>
              {m.blog_post_retry()}
            </a>
          )}
          {missing ? (
            <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
              {m.shared_evaluation_request()}
            </Link>
          ) : (
            <Link to="/blog" className={buttonVariants({ variant: "outline", size: "lg" })}>
              {m.blog_post_all()}
            </Link>
          )}
        </div>
      </div>

      {/*===== Stage =====*/}
      <div className="relative order-1 h-[12rem] lg:order-2 lg:col-span-6 lg:h-[22rem]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_50%_80%,rgb(255_194_26/0.08),transparent)]"
        />
        <NightSky className="end-[4%] top-0 h-14 w-[26%] lg:top-4 lg:h-24 lg:w-[30%]" />
        <div aria-hidden>
          <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
          <MascotCut
            name="signpost"
            eager
            className="absolute start-[4%] bottom-[0.9rem] w-[26%] translate-y-[4%] lg:bottom-[1.2rem] ltr:-scale-x-100"
          />
          <MascotCut
            name="plants"
            eager
            className="lively-sway absolute end-[-3%] bottom-[0.9rem] w-[14%] translate-y-[6%] lg:bottom-[1.2rem]"
          />
        </div>
        <MascotCut
          name="sniff"
          eager
          className="pm-sniff absolute end-[14%] bottom-[0.9rem] h-[6rem] w-auto translate-y-[4%] lg:bottom-[1.2rem] lg:h-[11rem] ltr:-scale-x-100"
        />
        <ChalkBubble
          tail="end"
          className="pm-pop absolute end-[24%] bottom-[calc(0.9rem+6.6rem)] max-w-[13rem] text-pretty lg:bottom-[calc(1.2rem+11.8rem)] lg:max-w-[17rem]"
        >
          {missing ? m.blog_post_missing_bubble() : m.blog_post_broken_bubble()}
        </ChalkBubble>
      </div>

      {/* The one moment: he trots in along the path nose down, then his bubble pops. Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .pm-sniff { animation: pm-walk .9s cubic-bezier(.2,.8,.25,1) .1s both; }
          .pm-pop { animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .9s both; transform-origin: 50% 100%; }
        }
        @keyframes pm-walk {
          from { opacity: 0; transform: translateX(-30%); }
          to { opacity: 1; transform: none; }
        }
        :dir(ltr) .pm-sniff { animation-name: pm-walk-ltr; }
        @keyframes pm-walk-ltr {
          from { opacity: 0; transform: translateX(30%); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}
