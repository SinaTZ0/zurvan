import { $createLinkNode, $isLinkNode, $toggleLink, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { cn } from "cn";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $setSelection,
  type BaseSelection,
} from "lexical";
import { useMemo, useRef, useState } from "react";

import { isSafeHref, type BlogBody } from "~/lib/blog-body";
import { getMediaVariantSize, MEDIA_VARIANTS } from "~/orpc/media/constants";
import {
  CaretClearancePlugin,
  EditablePlugin,
  HeadingLevelsPlugin,
  InitialContentPlugin,
  SafeLinksPlugin,
} from "~/routes/admin_post_form/components/editor/editor-plugins";
import { editorTheme } from "~/routes/admin_post_form/components/editor/editor-theme";
import { type FigureActions, FigureActionsContext } from "~/routes/admin_post_form/components/editor/figure-actions";
import { FigureDialog } from "~/routes/admin_post_form/components/editor/figure-dialog";
import { LinkDialog } from "~/routes/admin_post_form/components/editor/link-dialog";
import {
  $createFigureNode,
  $isFigureNode,
  type FigureFields,
  FigureNode,
  TipNode,
} from "~/routes/admin_post_form/components/editor/nodes";
import { Toolbar } from "~/routes/admin_post_form/components/editor/toolbar";
import { useFigureUpload } from "~/routes/admin_post_form/hooks/use-figure-upload";

/*===== Types =====*/
export type BodyEditorProps = {
  /** The editable element's id, for the plate's label and the form's «first field with a message». */
  id: string;
  /** Persian is typed right to left, the English body left to right. */
  language: "fa" | "en";
  /** The editable area's name for screen readers (its visible label is the plate's). */
  label: string;
  describedBy: string | undefined;
  invalid: boolean;
  /** The saved body (as read, with figure addresses), or null for a sheet that starts empty. */
  initialBody: BlogBody | null;
  placeholder: string;
  /** False while the form saves. */
  editable: boolean;
  /** A shorter empty sheet, for the English body that is often left unwritten. */
  compact?: boolean;
  /** Every change, as Lexical's JSON (`editorState.toJSON()`): the form sends it as the body. */
  onChange: (json: unknown) => void;
};

const NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, TipNode, FigureNode];

/*===== Body Editor =====*/
/**
 * The post's text (F16), written in Lexical and stored in the body format `app/lib/blog-body.ts` describes: a sheet of
 * the site's paper on the plate, set in the article's type so writing looks like the result, with its toolbar on top.
 * Browser-only: the form loads it with `React.lazy` behind `ClientOnly` (`lazy-body-editor.tsx`), so Lexical never
 * runs on the server or in the public pages' bundles. This is that chunk's default export.
 *
 * Lexical 0.52 stores no direction and gives every block `dir="auto"`, so an English sentence in a Persian post runs
 * left to right on its own line, here and in the article.
 */
export default function BodyEditor(props: BodyEditorProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: `blog-body-${props.language}`,
      theme: editorTheme(props.language),
      nodes: NODES,
      onError: (error: Error) => {
        // Lexical recovers by rejecting the update; the console keeps the reason.
        console.error("BodyEditor", error);
      },
    }),
    // The composer reads its config once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorSheet {...props} />
    </LexicalComposer>
  );
}

/*===== Editor Sheet =====*/
function EditorSheet({
  id,
  language,
  label,
  describedBy,
  invalid,
  initialBody,
  placeholder,
  editable,
  compact = false,
  onChange,
}: BodyEditorProps) {
  const [editor] = useLexicalComposerContext();
  const dir = language === "en" ? "ltr" : "rtl";

  // Where the caret was when a dialog opened: the dialog takes the focus, and its answer goes back there.
  const savedSelection = useRef<BaseSelection | null>(null);
  function saveSelection() {
    savedSelection.current = editor.getEditorState().read(() => $getSelection()?.clone() ?? null);
  }

  /*------ Link ------*/
  const [link, setLink] = useState<{
    session: number;
    open: boolean;
    editing: boolean;
    needsText: boolean;
    url: string;
  } | null>(null);

  function openLink(editing: boolean) {
    saveSelection();
    const { url, collapsed } = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return { url: "", collapsed: true };
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      const current = $isLinkNode(node) ? node : $isLinkNode(parent) ? parent : null;
      return { url: current?.getURL() ?? "", collapsed: selection.isCollapsed() };
    });
    setLink((previous) => ({
      session: (previous?.session ?? 0) + 1,
      open: true,
      editing,
      needsText: !editing && collapsed,
      url,
    }));
  }

  function applyLink({ url, text }: { url: string; text: string }) {
    const needsText = link?.needsText ?? false;
    editor.update(() => {
      if (savedSelection.current) $setSelection(savedSelection.current.clone());
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (needsText) {
        const node = $createLinkNode(url);
        node.append($createTextNode(text));
        selection.insertNodes([node]);
      } else {
        $toggleLink(url);
      }
    });
    setLink((previous) => previous && { ...previous, open: false });
  }

  function removeLink() {
    editor.update(() => {
      if (savedSelection.current) $setSelection(savedSelection.current.clone());
      $toggleLink(null);
    });
    setLink((previous) => previous && { ...previous, open: false });
  }

  /*------ Figures ------*/
  const figureUpload = useFigureUpload();
  const [figure, setFigure] = useState<
    | { session: number; open: boolean; mode: "new" }
    | { session: number; open: boolean; mode: "edit"; nodeKey: string; fields: FigureFields }
    | null
  >(null);

  function pickImage(file: File) {
    saveSelection();
    figureUpload.start(file);
    setFigure((previous) => ({ session: (previous?.session ?? 0) + 1, open: true, mode: "new" }));
  }

  const figureActions: FigureActions = useMemo(
    () => ({
      edit: (nodeKey) => {
        const fields = editor.getEditorState().read(() => {
          const node = $getNodeByKey(nodeKey);
          return $isFigureNode(node) ? node.getFields() : null;
        });
        if (!fields) return;
        setFigure((previous) => ({ session: (previous?.session ?? 0) + 1, open: true, mode: "edit", nodeKey, fields }));
      },
    }),
    [editor],
  );

  function closeFigure() {
    setFigure((previous) => previous && { ...previous, open: false });
    if (figure?.mode === "new") figureUpload.clear();
  }

  /** The uploaded image goes in where the caret was, as a block of its own, with a paragraph after it to type on. */
  function insertFigure(words: { alt: string; caption: string }) {
    const upload = figureUpload.upload;
    if (upload?.status !== "ready") return;
    const { media } = upload;
    const inline = getMediaVariantSize({
      spec: MEDIA_VARIANTS.figure.inline,
      mediaWidth: media.width,
      mediaHeight: media.height,
    });

    editor.update(() => {
      const node = $createFigureNode({
        mediaId: media.id,
        alt: words.alt,
        caption: words.caption,
        src: media.urls.inline ?? "",
        fullSrc: media.urls.full ?? "",
        width: inline.width,
        height: inline.height,
        placeholder: media.placeholder,
      });
      if (savedSelection.current) {
        $setSelection(savedSelection.current.clone());
        // On an empty line the image takes the line's place, so no blank paragraph is left above it.
        const selection = $getSelection();
        const line = $isRangeSelection(selection) ? selection.anchor.getNode().getTopLevelElement() : null;
        if ($isParagraphNode(line) && line.isEmpty()) line.replace(node);
        else $insertNodeToNearestRoot(node);
      } else {
        $getRoot().append(node);
      }
      let next = node.getNextSibling();
      if (!next) {
        next = $createParagraphNode();
        node.insertAfter(next);
      }
      if ($isElementNode(next)) next.selectStart();
    });
    setFigure((previous) => previous && { ...previous, open: false });
    figureUpload.clear();
  }

  function saveFigureWords(words: { alt: string; caption: string }) {
    if (figure?.mode !== "edit") return;
    editor.update(() => {
      const node = $getNodeByKey(figure.nodeKey);
      if ($isFigureNode(node)) node.setWords(words);
    });
    setFigure((previous) => previous && { ...previous, open: false });
  }

  function removeFigure() {
    if (figure?.mode !== "edit") return;
    editor.update(() => $getNodeByKey(figure.nodeKey)?.remove());
    setFigure((previous) => previous && { ...previous, open: false });
  }

  /*------ Figure Dialog's Picture ------*/
  const upload = figureUpload.upload;
  // A new image keeps showing the picked file from memory once it has arrived, so the picture doesn't reload.
  const dialogImage = figure?.mode === "edit" ? figure.fields.src || null : (upload?.preview ?? null);

  return (
    <FigureActionsContext.Provider value={figureActions}>
      {/*===== The Sheet =====*/}
      <div
        className={cn(
          "rounded-2xl bg-background ring-1 transition-shadow",
          invalid ? "ring-destructive/60" : "ring-foreground/15 focus-within:ring-foreground/30",
        )}
      >
        <Toolbar
          editorId={id}
          language={language}
          uploading={figureUpload.uploading}
          onLink={openLink}
          onImage={pickImage}
        />

        <div className="px-5 py-6 sm:px-9 sm:py-9">
          <div dir={dir} lang={language} className="relative mx-auto max-w-[65ch]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  id={id}
                  aria-label={label}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  aria-multiline
                  aria-placeholder={placeholder}
                  placeholder={
                    <p className="pointer-events-none absolute inset-x-0 top-0 text-[1.0625rem] leading-[2.05] text-muted-foreground/80 select-none md:text-lg md:leading-[2.1]">
                      {placeholder}
                    </p>
                  }
                  className={cn(
                    compact ? "min-h-[12rem]" : "min-h-[22rem]",
                    "text-[1.0625rem] leading-[2.05] text-foreground/85 outline-none md:text-lg md:leading-[2.1]",
                  )}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>
      </div>

      {/*===== Plugins =====*/}
      <InitialContentPlugin body={initialBody} />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin validateUrl={isSafeHref} />
      <HeadingLevelsPlugin />
      <SafeLinksPlugin />
      <EditablePlugin editable={editable} />
      <CaretClearancePlugin toolbarSelector={`[data-toolbar-for="${id}"]`} />
      <OnChangePlugin ignoreSelectionChange onChange={(state) => onChange(state.toJSON())} />

      {/*===== Dialogs =====*/}
      {link && (
        <LinkDialog
          key={`link-${link.session}`}
          open={link.open}
          onOpenChange={(open) => setLink((previous) => previous && { ...previous, open })}
          initialUrl={link.url}
          editing={link.editing}
          needsText={link.needsText}
          onApply={applyLink}
          onRemove={removeLink}
        />
      )}
      {figure && (
        <FigureDialog
          key={`figure-${figure.session}`}
          open={figure.open}
          onOpenChange={(open) => (open ? undefined : closeFigure())}
          mode={figure.mode}
          language={language}
          imageSrc={dialogImage}
          status={figure.mode === "edit" ? "ready" : (upload?.status ?? "failed")}
          problem={upload?.status === "failed" ? upload.problem : undefined}
          initialAlt={figure.mode === "edit" ? figure.fields.alt : ""}
          initialCaption={figure.mode === "edit" ? figure.fields.caption : ""}
          onPickAnother={(file) => figureUpload.start(file)}
          onSubmit={figure.mode === "edit" ? saveFigureWords : insertFigure}
          onRemove={removeFigure}
        />
      )}
    </FigureActionsContext.Provider>
  );
}
