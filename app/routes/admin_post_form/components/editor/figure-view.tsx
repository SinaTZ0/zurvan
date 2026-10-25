import { ImageIcon, PencilIcon } from "lucide-react";

import type { FigureFields } from "~/routes/admin_post_form/components/editor/nodes";
import { useFigureActions } from "~/routes/admin_post_form/components/editor/figure-actions";

/*===== Figure View =====*/
/**
 * An image in the editor, drawn as the article draws it: the `inline` size at its own aspect ratio over its blurred
 * placeholder, the caption under it. The whole image is a button that opens the figure dialog (her words for it, or
 * removing it); a pencil chip says so on hover and focus. A figure whose address isn't known (it can't happen after a
 * read, which always adds it) shows its description in a dashed frame instead.
 */
export function FigureView({ nodeKey, fields }: { nodeKey: string; fields: FigureFields }) {
  const { edit } = useFigureActions();
  const { src, alt, caption, width, height, placeholder } = fields;

  return (
    <figure className="m-0">
      <button
        type="button"
        onClick={() => edit(nodeKey)}
        className="group relative block w-full cursor-pointer rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
      >
        <span className="sr-only">ویرایش عکس: {alt}</span>
        {src ? (
          <img
            src={src}
            alt=""
            width={width || undefined}
            height={height || undefined}
            style={placeholder ? { backgroundImage: `url("${placeholder}")` } : undefined}
            className="mx-auto h-auto max-h-[36rem] w-auto max-w-full rounded-xl bg-muted bg-cover bg-center ring-1 ring-foreground/10 transition-opacity group-hover:opacity-90"
          />
        ) : (
          <span className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/25 p-6 text-center text-sm text-muted-foreground">
            <ImageIcon aria-hidden strokeWidth={1.5} className="size-6" />
            {alt}
          </span>
        )}
        <span
          aria-hidden
          className="absolute end-2.5 top-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-background/85 px-3 text-xs font-bold text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100"
        >
          <PencilIcon className="size-3.5" />
          ویرایش
        </span>
      </button>
      {caption && (
        <figcaption dir="auto" className="mt-2.5 text-center text-sm leading-6 text-pretty text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
