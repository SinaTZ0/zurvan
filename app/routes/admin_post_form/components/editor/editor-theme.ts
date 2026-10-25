import { cn } from "cn";
import type { EditorThemeClasses } from "lexical";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Editor Theme =====*/
/**
 * The classes Lexical puts on each block, so writing looks like the article it becomes: the article's faces and
 * sizes, the H2 in Estedad, the quote with its gold rule, the tip as the dog's chalk bubble (Marhey in an ink outline
 * with its tail; the article sets the dog beside it), and the numbered list in the page's digits. The classes follow the article's renderer (`app/components/blog/post-body.tsx`); the sheet's own
 * size and leading are the editor's (`body-editor.tsx`).
 *
 * The tip's tail is a rotated square in physical `right`/`bottom` borders, like `ChalkBubble`'s, whichever way the page
 * reads; it is filled with the sheet's paper (`bg-background`), so the bubble is cut from it.
 */
export function editorTheme(language: "fa" | "en"): EditorThemeClasses {
  return {
    paragraph: "mt-6 text-pretty first:mt-0 [&:dir(ltr)]:leading-[1.8]",
    heading: {
      h2: cn(
        DISPLAY_HEADING,
        "mt-14 text-[1.45rem] leading-[1.5] text-balance text-foreground first:mt-0 md:text-[1.7rem]",
      ),
      h3: "mt-10 text-lg leading-[1.7] font-extrabold text-balance text-foreground first:mt-0 md:text-xl",
    },
    quote:
      "mt-8 border-s-[3px] border-primary ps-5 text-lg leading-[1.95] font-bold text-pretty text-foreground first:mt-0 md:ps-7 md:text-xl md:leading-[2]",
    tip: cn(
      "relative mt-10 mb-4 rounded-[1.6rem] border-2 border-foreground bg-background px-5 py-4 font-hand text-[1.0625rem] leading-[1.95] text-foreground first:mt-0 sm:px-6 sm:py-5 md:text-lg",
      "after:absolute after:-bottom-[9px] after:end-9 after:size-4 after:rotate-45 after:border-r-2 after:border-b-2 after:border-foreground after:bg-background after:content-['']",
    ),
    list: {
      ul: "mt-6 flex list-disc flex-col gap-2.5 ps-6 marker:font-bold marker:text-primary first:mt-0",
      ol: cn(
        "mt-6 flex flex-col gap-2.5 ps-6 marker:font-bold marker:text-primary first:mt-0",
        language === "fa" ? "[list-style-type:persian]" : "list-decimal",
      ),
      listitem: "ps-1 text-pretty",
      nested: { listitem: "list-none [&>ol]:mt-2.5 [&>ul]:mt-2.5" },
    },
    link: "text-primary underline decoration-primary/50 underline-offset-4",
    text: { bold: "font-extrabold text-foreground", italic: "italic" },
  };
}
