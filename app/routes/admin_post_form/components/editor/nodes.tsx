import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getState,
  $setState,
  createState,
  DecoratorNode,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type ParagraphNode,
  type RangeSelection,
} from "lexical";
import type { JSX } from "react";

import { FigureView } from "~/routes/admin_post_form/components/editor/figure-view";

/*===== Tip Node =====*/
// «سگ می‌گه»: a block of inline text the article draws as the mascot's chalk bubble (`tip` in app/lib/blog-body.ts).
// The same shape as a quote. The trial (Step 0) found the three overrides below are what make it behave like one.

export class TipNode extends ElementNode {
  $config() {
    return this.config("tip", { extends: ElementNode });
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("aside");
    element.className = config.theme.tip ?? "";
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  /** Enter at the end leaves the bubble for a plain paragraph, as in a quote. */
  insertNewAfter(_selection: RangeSelection, restoreSelection?: boolean): ParagraphNode {
    const next = $createParagraphNode();
    this.insertAfter(next, restoreSelection);
    return next;
  }

  /** Backspace at the start turns the bubble back into a paragraph. */
  collapseAtStart(): true {
    const paragraph = $createParagraphNode();
    this.getChildren().forEach((child) => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }

  canMergeWhenEmpty(): true {
    return true;
  }
}

export function $createTipNode(): TipNode {
  return $applyNodeReplacement(new TipNode());
}

export function $isTipNode(node: LexicalNode | null | undefined): node is TipNode {
  return node instanceof TipNode;
}

/*===== Figure Node =====*/
// An uploaded image. Its state is flat, so the JSON has the field names of `BlogFigure` (`mediaId`, `alt`, `caption`,
// `src`, `fullSrc`, `width`, `height`, `placeholder`). The server keeps only the author's three (the id and the words)
// and writes the size and placeholder again from the media row; the rest are for the editor's own view and the
// preview, and come back with every read of the post.

const text = (value: unknown) => (typeof value === "string" ? value : "");
const size = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const mediaIdState = createState("mediaId", { parse: text });
const altState = createState("alt", { parse: text });
const captionState = createState("caption", { parse: text });
const srcState = createState("src", { parse: text });
const fullSrcState = createState("fullSrc", { parse: text });
const widthState = createState("width", { parse: size });
const heightState = createState("height", { parse: size });
const placeholderState = createState("placeholder", { parse: text });

export type FigureFields = {
  mediaId: string;
  alt: string;
  caption: string;
  src: string;
  fullSrc: string;
  width: number;
  height: number;
  placeholder: string;
};

export class FigureNode extends DecoratorNode<JSX.Element> {
  $config() {
    return this.config("figure", {
      extends: DecoratorNode,
      stateConfigs: [
        { stateConfig: mediaIdState, flat: true },
        { stateConfig: altState, flat: true },
        { stateConfig: captionState, flat: true },
        { stateConfig: srcState, flat: true },
        { stateConfig: fullSrcState, flat: true },
        { stateConfig: widthState, flat: true },
        { stateConfig: heightState, flat: true },
        { stateConfig: placeholderState, flat: true },
      ],
    });
  }

  getFields(): FigureFields {
    return {
      mediaId: $getState(this, mediaIdState),
      alt: $getState(this, altState),
      caption: $getState(this, captionState),
      src: $getState(this, srcState),
      fullSrc: $getState(this, fullSrcState),
      width: $getState(this, widthState),
      height: $getState(this, heightState),
      placeholder: $getState(this, placeholderState),
    };
  }

  /** Her words for the image; the image itself is replaced only by removing the figure and adding another. */
  setWords({ alt, caption }: { alt: string; caption: string }): this {
    const writable = $setState(this, altState, alt);
    return $setState(writable, captionState, caption);
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    // Lexical sets `contenteditable="false"` on a decorator's element; the figure is a block of its own.
    element.className = "my-7";
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): false {
    return false;
  }

  /** The caption stands for the image in the text the editor copies as plain text. */
  getTextContent(): string {
    return $getState(this, captionState);
  }

  decorate(): JSX.Element {
    return <FigureView nodeKey={this.getKey()} fields={this.getFields()} />;
  }
}

export function $createFigureNode(fields: FigureFields): FigureNode {
  let node = $applyNodeReplacement(new FigureNode());
  node = $setState(node, mediaIdState, fields.mediaId);
  node = $setState(node, altState, fields.alt);
  node = $setState(node, captionState, fields.caption);
  node = $setState(node, srcState, fields.src);
  node = $setState(node, fullSrcState, fields.fullSrc);
  node = $setState(node, widthState, fields.width);
  node = $setState(node, heightState, fields.height);
  return $setState(node, placeholderState, fields.placeholder);
}

export function $isFigureNode(node: LexicalNode | null | undefined): node is FigureNode {
  return node instanceof FigureNode;
}
