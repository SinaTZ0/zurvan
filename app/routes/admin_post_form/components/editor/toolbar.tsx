import { $isLinkNode } from "@lexical/link";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { cn } from "cn";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  type ElementNode,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  type LucideIcon,
  PilcrowIcon,
  Redo2Icon,
  TextQuoteIcon,
  Undo2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Spinner } from "~/components/ui/spinner";
import { MEDIA_ACCEPTED_TYPES } from "~/orpc/media/constants";
import { $createTipNode, $isTipNode } from "~/routes/admin_post_form/components/editor/nodes";

/*===== Types =====*/
export type BlockType = "paragraph" | "h2" | "h3" | "quote" | "tip" | "bullet" | "number";

type ToolbarState = {
  block: BlockType;
  bold: boolean;
  italic: boolean;
  link: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

const IDLE: ToolbarState = {
  block: "paragraph",
  bold: false,
  italic: false,
  link: false,
  canUndo: false,
  canRedo: false,
};

/*===== Toolbar State =====*/
/** What the caret is in, read after every update: the block's type, bold and italic, a link, and the history. */
function useToolbarState(): ToolbarState {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState(IDLE);

  const read = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    const anchor = selection.anchor.getNode();
    const top =
      anchor.getKey() === "root"
        ? null
        : ($findMatchingParent(anchor, (node) => {
            const parent = node.getParent();
            return parent !== null && $isRootOrShadowRoot(parent);
          }) as ElementNode | null);

    let block: BlockType = "paragraph";
    if ($isListNode(top)) {
      // The innermost list says which kind she is typing in.
      block = ($getNearestNodeOfType(anchor, ListNode) ?? top).getListType() === "number" ? "number" : "bullet";
    } else if ($isHeadingNode(top)) {
      block = top.getTag() === "h3" ? "h3" : "h2";
    } else if ($isTipNode(top)) {
      block = "tip";
    } else if (top?.getType() === "quote") {
      block = "quote";
    }

    const parent = anchor.getParent();
    setState((previous) => ({
      ...previous,
      block,
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      link: $isLinkNode(parent) || $isLinkNode(anchor),
    }));
  }, []);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => editorState.read(read)),
        editor.registerCommand(
          CAN_UNDO_COMMAND,
          (canUndo) => {
            setState((previous) => ({ ...previous, canUndo }));
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          CAN_REDO_COMMAND,
          (canRedo) => {
            setState((previous) => ({ ...previous, canRedo }));
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor, read],
  );

  return state;
}

/*===== Toolbar =====*/
/**
 * The sheet's tools, in the order she writes: what kind of block (text, H2, H3), the two marks, the two lists, the
 * quote and «سگ می‌گه», a link and an image, then undo and redo. Each is a 40px button with its name for screen readers;
 * the block type and the marks she is in are pressed (`aria-pressed`) in flat gold, the one gold on the sheet.
 *
 * It sticks under the Admin's header while she scrolls a long text, and on a phone it scrolls sideways (snapping per
 * group) instead of wrapping. The buttons don't take focus from the text (`pointerdown` is cancelled), so a phone's
 * keyboard stays open and the caret stays where she was.
 */
export function Toolbar({
  editorId,
  language,
  uploading,
  onLink,
  onImage,
}: {
  /** The editable element's id: the toolbar is found by it (`data-toolbar-for`) to keep the caret clear of it. */
  editorId: string;
  language: "fa" | "en";
  /** An image is on its way: the image button shows it and waits. */
  uploading: boolean;
  /** Opens the link dialog for the selection. */
  onLink: (editingLink: boolean) => void;
  onImage: (file: File) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const state = useToolbarState();
  const fileInput = useRef<HTMLInputElement>(null);

  /*------ Blocks ------*/
  const setBlock = (make: () => ElementNode) =>
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, make);
    });

  /** A block button toggles: pressing the type she is already in goes back to plain text. */
  const toggleBlock = (type: BlockType, make: () => ElementNode) =>
    setBlock(state.block === type ? () => $createParagraphNode() : make);

  const toggleList = (type: "bullet" | "number") => {
    if (state.block === type) editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    else
      editor.dispatchCommand(
        type === "bullet" ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined,
      );
  };

  const english = language === "en";

  return (
    <div
      role="toolbar"
      data-toolbar-for={editorId}
      aria-label={english ? "ابزار متن انگلیسی" : "ابزار متن"}
      aria-orientation="horizontal"
      // The toolbar's own words stay Persian (the Admin's), even over the English sheet.
      dir="rtl"
      className={cn(
        "sticky top-[calc(4rem+env(safe-area-inset-top))] z-20 -mx-px flex snap-x [scrollbar-width:none] items-center gap-1 overflow-x-auto rounded-t-2xl border-b border-foreground/10 bg-card/95 px-2 py-1.5 backdrop-blur-md",
      )}
    >
      {/*------ Block Type ------*/}
      <ToolGroup>
        <ToolButton
          icon={PilcrowIcon}
          label="متن ساده"
          pressed={state.block === "paragraph"}
          onPress={() => setBlock(() => $createParagraphNode())}
        />
        <ToolButton
          icon={Heading2Icon}
          label="تیتر بخش (H2)"
          pressed={state.block === "h2"}
          onPress={() => toggleBlock("h2", () => $createHeadingNode("h2"))}
        />
        <ToolButton
          icon={Heading3Icon}
          label="تیتر کوچک (H3)"
          pressed={state.block === "h3"}
          onPress={() => toggleBlock("h3", () => $createHeadingNode("h3"))}
        />
      </ToolGroup>

      {/*------ Marks ------*/}
      <ToolGroup>
        <ToolButton
          icon={BoldIcon}
          label="پررنگ"
          pressed={state.bold}
          onPress={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        />
        <ToolButton
          icon={ItalicIcon}
          label="کج"
          pressed={state.italic}
          onPress={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        />
      </ToolGroup>

      {/*------ Lists and Asides ------*/}
      <ToolGroup>
        <ToolButton
          icon={ListIcon}
          label="فهرست"
          pressed={state.block === "bullet"}
          onPress={() => toggleList("bullet")}
        />
        <ToolButton
          icon={ListOrderedIcon}
          label="فهرست شماره‌دار"
          pressed={state.block === "number"}
          onPress={() => toggleList("number")}
        />
        <ToolButton
          icon={TextQuoteIcon}
          label="نقل‌قول"
          pressed={state.block === "quote"}
          onPress={() => toggleBlock("quote", () => $createQuoteNode())}
        />
        {/* The blog's own block, so it carries its name: the article draws it as the dog speaking. */}
        <ToolButton
          label="سگ می‌گه: نکته توی حباب حرف سگ"
          text="سگ می‌گه"
          pressed={state.block === "tip"}
          onPress={() => toggleBlock("tip", () => $createTipNode())}
        />
      </ToolGroup>

      {/*------ Link and Image ------*/}
      <ToolGroup>
        <ToolButton icon={LinkIcon} label="پیوند" pressed={state.link} onPress={() => onLink(state.link)} />
        <ToolButton
          icon={uploading ? undefined : ImagePlusIcon}
          busy={uploading}
          label={uploading ? "عکس داره بار می‌شه" : "عکس"}
          disabled={uploading}
          onPress={() => fileInput.current?.click()}
        />
        <input
          ref={fileInput}
          type="file"
          accept={MEDIA_ACCEPTED_TYPES}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Lets the same file be picked again (after a failure, or for a second figure).
            event.target.value = "";
            if (file) onImage(file);
          }}
        />
      </ToolGroup>

      {/*------ History ------*/}
      <ToolGroup last>
        <ToolButton
          icon={Undo2Icon}
          label="برگرداندن"
          disabled={!state.canUndo}
          onPress={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          flip
        />
        <ToolButton
          icon={Redo2Icon}
          label="دوباره"
          disabled={!state.canRedo}
          onPress={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          flip
        />
      </ToolGroup>
    </div>
  );
}

/*===== Tool Group =====*/
/** A run of related tools, split from the next by an ink hairline; on a phone the row snaps to each group. */
function ToolGroup({ last = false, children }: { last?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex shrink-0 snap-start items-center gap-0.5", !last && "border-e border-foreground/10 pe-1")}>
      {children}
    </div>
  );
}

/*===== Tool Button =====*/
function ToolButton({
  icon: Icon,
  text,
  label,
  pressed,
  disabled = false,
  busy = false,
  flip = false,
  onPress,
}: {
  icon?: LucideIcon;
  /** A visible word instead of an icon. */
  text?: string;
  label: string;
  /** Left out for an action (undo, image), which has no on and off. */
  pressed?: boolean;
  disabled?: boolean;
  busy?: boolean;
  /** Undo and redo point the way the page reads. */
  flip?: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      // Keeps the focus (and a phone's keyboard) in the text: the command runs on the selection she left.
      onPointerDown={(event) => event.preventDefault()}
      onClick={onPress}
      className={cn(
        "inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-bold outline-none",
        "transition-[background-color,color] duration-200 motion-reduce:transition-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-35",
        text ? "px-3" : "px-0",
        pressed
          ? "bg-primary text-primary-foreground"
          : "text-foreground/75 hover:bg-foreground/8 hover:text-foreground",
      )}
    >
      {busy && <Spinner aria-hidden className="size-4" />}
      {Icon && <Icon aria-hidden strokeWidth={2} className={cn("size-[18px]", flip && "rtl:-scale-x-100")} />}
      {text && (
        <span aria-hidden className="font-hand text-[15px] font-normal">
          {text}
        </span>
      )}
    </button>
  );
}
