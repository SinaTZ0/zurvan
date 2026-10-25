import { LinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode } from "@lexical/rich-text";
import { useEffect, useLayoutEffect } from "react";

import { isSafeHref, type BlogBody } from "~/lib/blog-body";

/*===== Editor Plugins =====*/
// Small plugins the trial (Step 0) showed the article needs. Each renders nothing.

/**
 * Loads the saved body once, as Lexical's own state (`parseEditorState` of the stored JSON: the stored shape is a
 * subset of Lexical's). Tagged `history-merge`, so it isn't an undo step and the form doesn't count it as an edit.
 * An empty body is left to the composer's own empty paragraph: Lexical refuses an editor state with an empty root.
 */
export function InitialContentPlugin({ body }: { body: BlogBody | null }) {
  const [editor] = useLexicalComposerContext();

  // Before paint, so the sheet never flashes empty; once, since the editor owns the text from then on.
  useLayoutEffect(() => {
    if (!body || body.root.children.length === 0) return;
    try {
      editor.setEditorState(editor.parseEditorState(JSON.stringify(body)), { tag: "history-merge" });
    } catch (error) {
      // A body this editor can't read is a bug, not her mistake: the sheet starts empty and the console says why.
      console.error("InitialContentPlugin: the saved body didn't load", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the body is the starting text only
  }, [editor]);

  return null;
}

/** Pasted headings outside H2/H3 (a document's title, deeper levels) become the nearest one the article allows. */
export function HeadingLevelsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerNodeTransform(HeadingNode, (node) => {
        const tag = node.getTag();
        if (tag === "h1") node.setTag("h2");
        else if (tag !== "h2" && tag !== "h3") node.setTag("h3");
      }),
    [editor],
  );

  return null;
}

/**
 * A pasted link the article can't carry (`javascript:`, `data:`, `//host`…) keeps its words and loses the link.
 * `LinkPlugin`'s `validateUrl` only checks links made with the toolbar; the server drops them too.
 */
export function SafeLinksPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerNodeTransform(LinkNode, (node) => {
        if (isSafeHref(node.getURL())) return;
        for (const child of node.getChildren()) node.insertBefore(child);
        node.remove();
      }),
    [editor],
  );

  return null;
}

/** The sheet can't be typed in while the form saves, as a disabled fieldset does for the other fields. */
export function EditablePlugin({ editable }: { editable: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(editable);
  }, [editor, editable]);

  return null;
}

/** Air kept between the caret and a bar that covers the sheet. */
const CARET_AIR_PX = 16;

/**
 * Keeps the line she is typing out from under the bars that float over the sheet: the save bar (and the Admin's tab
 * bar under it) on a phone, and the sticky toolbar at the top. Lexical scrolls the caret into the window, but not out
 * from behind those, so after each change the caret's line is measured and the page scrolled by what is hidden.
 *
 * @param toolbarSelector Finds the sheet's sticky toolbar.
 */
export function CaretClearancePlugin({ toolbarSelector }: { toolbarSelector: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
        // Only her typing: not a load, and not a selection-only change (a click elsewhere mustn't move the page).
        if (tags.has("history-merge") || (dirtyElements.size === 0 && dirtyLeaves.size === 0)) return;
        const root = editor.getRootElement();
        const selection = window.getSelection();
        if (!root || !selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) return;

        requestAnimationFrame(() => {
          const caret = selection.rangeCount > 0 ? selection.getRangeAt(0).getBoundingClientRect() : null;
          if (!caret || (caret.top === 0 && caret.bottom === 0)) return;
          const saveBar = document.querySelector<HTMLElement>("[data-post-save-bar]")?.getBoundingClientRect();
          const bottomEdge = saveBar && saveBar.top < window.innerHeight ? saveBar.top : window.innerHeight;
          const topEdge = document.querySelector<HTMLElement>(toolbarSelector)?.getBoundingClientRect().bottom ?? 0;
          if (caret.bottom > bottomEdge - CARET_AIR_PX)
            window.scrollBy({ top: caret.bottom - bottomEdge + CARET_AIR_PX });
          else if (caret.top < topEdge + CARET_AIR_PX) window.scrollBy({ top: caret.top - topEdge - CARET_AIR_PX });
        });
      }),
    [editor, toolbarSelector],
  );

  return null;
}
