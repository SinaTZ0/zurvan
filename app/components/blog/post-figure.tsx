import { Maximize2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "~/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "~/components/ui/dialog";
import type { BlogFigure } from "~/lib/blog-body";
import { m } from "~/paraglide/messages";

/*===== Post Figure =====*/
/**
 * An image in a post: the `inline` size at its stored width and height (so the browser keeps its room before it loads),
 * lazy, over its blurred placeholder, with the caption under it. A tall photo is capped at most of the screen's height
 * and centred, so a portrait never runs a whole screen of the text away.
 *
 * Pressing it opens the `full` size in a lightbox (when the post has one), which zooms in from the page and back. A
 * figure without an address yet (an editor's figure still uploading) draws nothing.
 */
export function PostFigure({ figure }: { figure: BlogFigure }) {
  const [open, setOpen] = useState(false);
  if (!figure.src) return null;

  const image = (
    <img
      src={figure.src}
      alt={figure.alt}
      width={figure.width}
      height={figure.height}
      loading="lazy"
      decoding="async"
      // The placeholder is a tiny image stretched to the box, which is what blurs it.
      style={
        figure.placeholder ? { backgroundImage: `url("${figure.placeholder}")`, backgroundSize: "cover" } : undefined
      }
      className="mx-auto block h-auto max-h-[75svh] w-auto max-w-full"
    />
  );

  return (
    <figure className="mt-10 first:mt-0">
      {figure.fullSrc ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={m.blog_body_figure_open({ alt: figure.alt })}
            className="group relative block w-full overflow-hidden rounded-2xl bg-sunken ring-1 ring-foreground/15 transition-shadow outline-none hover:ring-foreground/35 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {image}
            <span
              aria-hidden
              className="absolute end-3 bottom-3 grid size-9 place-items-center rounded-full bg-background/80 text-foreground opacity-0 ring-1 ring-foreground/20 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100"
            >
              <Maximize2Icon className="size-4" strokeWidth={2} />
            </span>
          </button>

          {/*------ Lightbox ------*/}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              showCloseButton={false}
              className="gap-0 rounded-3xl bg-jet paper-grain p-2 sm:max-w-[min(92vw,75rem)]"
            >
              <DialogTitle className="sr-only">{figure.alt}</DialogTitle>
              <img
                src={figure.fullSrc}
                alt={figure.alt}
                decoding="async"
                className="mx-auto max-h-[85dvh] w-auto max-w-full rounded-2xl object-contain"
              />
              <DialogClose
                aria-label={m.blog_body_figure_close()}
                className={buttonVariants({
                  variant: "outline",
                  size: "icon",
                  className: "absolute end-4 top-4 border-foreground/20 bg-background/80",
                })}
              >
                <XIcon aria-hidden />
              </DialogClose>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-sunken ring-1 ring-foreground/15">{image}</div>
      )}

      {figure.caption && (
        <figcaption
          dir="auto"
          className="mx-auto mt-3 max-w-[56ch] text-center text-sm leading-7 text-pretty text-muted-foreground"
        >
          {figure.caption}
        </figcaption>
      )}
    </figure>
  );
}
