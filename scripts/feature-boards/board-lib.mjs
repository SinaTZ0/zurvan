// The shared parts of every feature board: the style, the Excalidraw element factory, text and note cards, the step
// layout (title, screenshot, notes column) and writing the scene. A board script makes one board with `createBoard`,
// lays out its header and steps, and calls `write`.
// Scene units are the shots' CSS pixels (the PNGs are DPR 2, so they stay sharp when zoomed in).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";

/*===== Style =====*/
export const INK = "#1e1e1e";
export const MUTED = "#868e96";
export const SUBTLE = "#495057"; // the one-line summary under a title
export const CALLOUT = "#e03131"; // highlights, note cards and their arrows
export const RETURNING = "#2f9e44"; // a second customer path (green)
export const ADMIN = "#1971c2"; // the Admin's side (blue)
// Light card fills, one per colour.
export const TINT = { [CALLOUT]: "#fff5f5", [RETURNING]: "#ebfbee", [ADMIN]: "#e7f5ff", [INK]: "#f8f9fa" };
const FONT = 5; // Excalifont; Persian falls back to the system's Arabic-script font
export const NOTE_SIZE = 20;
export const NOTE_WIDTH = 280; // the widest a note card gets
const CARD_PAD = 14;
export const SHOT_WIDTH = 390;
export const NOTES_GAP = 70; // between a shot's right edge and its notes column
export const STEP_GAP = 460; // between one step's shot and the next step's notes: room for the big arrow
export const PITCH = SHOT_WIDTH + NOTES_GAP + NOTE_WIDTH + STEP_GAP;
/** Where a board's first row of steps starts; the header sits above it. */
export const ROW1 = 0;

/**
 * Rough width of a line: Persian glyphs average about half the font size. Excalidraw keeps the stored width and clips
 * the last letter when it's short, so the box is measured wide; right-aligned text doesn't mind the spare room.
 */
export const lineWidth = (line, size) => Math.ceil(line.length * size * 0.56) + 8;

/** Wraps on spaces to a column width; "\n" in the source forces a break. */
export function wrap(text, size, width) {
  const maxChars = Math.floor(width / (size * 0.56));
  return text
    .split("\n")
    .flatMap((paragraph) => {
      const lines = [];
      let line = "";
      for (const word of paragraph.split(" ")) {
        if (line && (line + " " + word).length > maxChars) {
          lines.push(line);
          line = word;
        } else line = line ? `${line} ${word}` : word;
      }
      return [...lines, line];
    })
    .join("\n");
}

/** A random phone number in the 0935 range, so a board's new customer is new on every run. */
export const freshPhone = () => `0935${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;

const rand = () => Math.floor(Math.random() * 2 ** 31);

/** Records an arrow on a shape, so the shape knows what is attached to it. */
function attach(shape, arrowId) {
  shape.boundElements = [...(shape.boundElements ?? []), { id: arrowId, type: "arrow" }];
}

/*===== Board =====*/
/**
 * Starts a board: reads the shots its capture script recorded in `.tmp-claude/feature-boards/<name>/shots/` and
 * returns the drawing functions, all writing into this board's scene.
 *
 * @param name The board's file name without extension, e.g. `01-sign-in`.
 */
export async function createBoard({ name }) {
  const SHOTS = `.tmp-claude/feature-boards/${name}/shots`;
  let shots = {};
  try {
    ({ shots } = JSON.parse(readFileSync(`${SHOTS}/shots.json`, "utf8")));
  } catch {
    // A board with no shots (the index) draws only text and shapes.
  }

  /*===== Element Factory =====*/
  let seq = 0;
  const elements = [];
  const files = {};
  const now = Date.now();

  function base(type, props) {
    seq += 1;
    return {
      id: `${type}-${seq}`,
      type,
      angle: 0,
      strokeColor: INK,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      // Clean lines everywhere ("Architect"), not the sketchy default.
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: rand(),
      version: 1,
      versionNonce: rand(),
      isDeleted: false,
      boundElements: null,
      updated: now,
      link: null,
      locked: false,
      index: `a${String(seq).padStart(4, "0")}`,
      ...props,
    };
  }

  const add = (el) => (elements.push(el), el);

  /*===== Text and Shapes =====*/
  /** Right-aligned text whose right edge sits at `right`. */
  function text({ right, y, value, size = NOTE_SIZE, color = INK, width = NOTE_WIDTH, groupIds = [] }) {
    const wrapped = wrap(value, size, width);
    const lines = wrapped.split("\n");
    const w = Math.max(...lines.map((l) => lineWidth(l, size)));
    const h = Math.ceil(lines.length * size * 1.25);
    return add(
      base("text", {
        x: right - w,
        y,
        width: w,
        height: h,
        strokeColor: color,
        groupIds,
        text: wrapped,
        originalText: wrapped,
        fontSize: size,
        fontFamily: FONT,
        textAlign: "right",
        verticalAlign: "top",
        containerId: null,
        lineHeight: 1.25,
        autoResize: true,
      }),
    );
  }

  function rect({ x, y, w, h, color = CALLOUT, width = 2, style = "solid", fill = "transparent", groupIds = [] }) {
    return add(
      base("rectangle", {
        x,
        y,
        width: w,
        height: h,
        strokeColor: color,
        strokeWidth: width,
        strokeStyle: style,
        backgroundColor: fill,
        groupIds,
        roundness: { type: 3 },
      }),
    );
  }

  /**
   * An arrow through absolute points; more than two points draw a curve. `from`/`to` attach its ends to shapes, so it
   * follows them when they're moved in Excalidraw.
   */
  function arrow({ points, color = INK, width = 2, head = "arrow", from, to }) {
    const [x0, y0] = points[0];
    const rel = points.map(([x, y]) => [x - x0, y - y0]);
    const xs = rel.map((p) => p[0]);
    const ys = rel.map((p) => p[1]);
    const el = add(
      base("arrow", {
        x: x0,
        y: y0,
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
        strokeColor: color,
        strokeWidth: width,
        roundness: points.length > 2 ? { type: 2 } : null,
        points: rel,
        lastCommittedPoint: null,
        startBinding: from ? { elementId: from.id, focus: 0, gap: 4 } : null,
        endBinding: to ? { elementId: to.id, focus: 0, gap: 4 } : null,
        startArrowhead: null,
        endArrowhead: head,
        elbowed: false,
      }),
    );
    if (from) attach(from, el.id);
    if (to) attach(to, el.id);
    return el;
  }

  /*===== Images =====*/
  // PNG → JPEG through Chromium's canvas, to keep the board light. Opened on the first image only.
  let browser;
  let page;
  async function jpegDataUrl(shotName) {
    if (!page) {
      browser = await chromium.launch();
      page = await browser.newPage();
    }
    const src = `data:image/png;base64,${readFileSync(`${SHOTS}/${shotName}.png`).toString("base64")}`;
    return page.evaluate(async (s) => {
      const img = new Image();
      img.src = s;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      return c.toDataURL("image/jpeg", 0.82);
    }, src);
  }

  async function image({ name: shotName, x, y }) {
    const shot = shots[shotName];
    if (!shot) throw new Error(`${name}: no shot named ${shotName}`);
    const fileId = `shot-${shotName}`;
    files[fileId] = {
      mimeType: "image/jpeg",
      id: fileId,
      dataURL: await jpegDataUrl(shotName),
      created: now,
      lastRetrieved: now,
    };
    add(base("image", { x, y, width: SHOT_WIDTH, height: shot.height, fileId, status: "saved", scale: [1, 1], crop: null }));
    // A thin frame, so the dark screen's edge reads on the white board.
    rect({ x: x - 4, y: y - 4, w: SHOT_WIDTH + 8, h: shot.height + 8, color: MUTED, width: 1 });
  }

  /*===== Note Card =====*/
  /** A note in a thin dotted card, grouped with its text. Its right edge sits at `right`. */
  function card({ right, y, value, color }) {
    const groupIds = [`card-${seq + 1}`];
    const wrapped = wrap(value, NOTE_SIZE, NOTE_WIDTH - CARD_PAD * 2);
    const lines = wrapped.split("\n");
    const w = Math.max(...lines.map((l) => lineWidth(l, NOTE_SIZE))) + CARD_PAD * 2;
    const h = Math.ceil(lines.length * NOTE_SIZE * 1.25) + CARD_PAD * 2;
    const box = rect({ x: right - w, y, w, h, color, width: 1, style: "dotted", fill: TINT[color], groupIds });
    text({ right: right - CARD_PAD, y: y + CARD_PAD, value, color: INK, width: NOTE_WIDTH - CARD_PAD * 2, groupIds });
    return box;
  }

  /*===== Verification =====*/
  /**
   * The owner's sign-off: «تأیید شد» with an empty square to tick, then an empty «یادداشت:» card for her notes. Both
   * sit in a row whose right edge is at `right`, from `y` down.
   *
   * @returns The left edge of the row.
   */
  function verification({ right, y, notesWidth = 640, height = 150 }) {
    /*------ The tick box ------*/
    const tickW = 220;
    const groupIds = [`verify-${seq + 1}`];
    rect({ x: right - tickW, y, w: tickW, h: height, color: INK, width: 2, fill: "#fff9db", groupIds });
    text({ right: right - 24, y: y + height / 2 - 20, value: "تأیید شد", size: 32, width: 200, groupIds });
    rect({ x: right - tickW + 24, y: y + height / 2 - 22, w: 44, h: 44, color: INK, width: 3, fill: "#ffffff", groupIds });

    /*------ The notes card ------*/
    const notesRight = right - tickW - 30;
    const notesGroup = [`notes-${seq + 1}`];
    rect({ x: notesRight - notesWidth, y, w: notesWidth, h: height, color: MUTED, width: 1, style: "dashed", groupIds: notesGroup });
    text({ right: notesRight - 18, y: y + 14, value: "یادداشت:", size: 24, color: SUBTLE, width: 200, groupIds: notesGroup });
    return notesRight - notesWidth;
  }

  /*===== Header =====*/
  /**
   * The board's title, its one-line summary and the colour key, at the top right; the sign-off sits left of the title.
   *
   * @param key Labels in their colours, right to left, e.g. `[{ value: "سبز: مشتری قدیمی", color: RETURNING }]`.
   */
  function header({ title, summary, key = [] }) {
    const titleBox = text({ right: 0, y: -330, value: title, size: 52, width: 1600 });
    text({ right: 0, y: -250, width: 1600, size: 26, color: SUBTLE, value: summary });
    let keyRight = 0;
    for (const { value, color } of key) {
      const label = text({ right: keyRight, y: -190, value, size: 24, color, width: 500 });
      keyRight = label.x - 60;
    }
    // Clear of the title and of the summary line, whichever is wider.
    const summaryWidth = Math.min(1600, lineWidth(summary, 26));
    verification({ right: -Math.max(titleBox.width, summaryWidth) - 90, y: -335 });
  }

  /*===== Step =====*/
  /**
   * One page of the journey: its title, the screenshot, and a notes column on the shot's right (read first in RTL), each
   * note a card attached by an arrow to a highlighted part of the screen. A note's `box` is a recorded target, or `area`
   * gives CSS px by hand. Returns the step's geometry for the arrows between steps.
   *
   * @param col The column, counted from the right (0 is the first step).
   */
  async function step({ name: shotName, col, top, number, title, notes, color = CALLOUT, titleColor = INK }) {
    const right = -col * PITCH; // the notes column's right edge
    const shotX = right - NOTE_WIDTH - NOTES_GAP - SHOT_WIDTH;
    const shot = shots[shotName];

    text({ right, y: top - 70, value: `${number}. ${title}`, size: 34, color: titleColor, width: 800 });
    await image({ name: shotName, x: shotX, y: top });

    /*------ Notes ------*/
    let cursor = top;
    const missing = notes.filter((n) => !(n.area ?? shot.boxes[n.box]));
    if (missing.length) console.warn(`${shotName}: no box for ${missing.map((n) => n.box).join(", ")}`);
    const placed = notes
      .map((n) => ({ ...n, target: n.area ?? shot.boxes[n.box] }))
      .filter((n) => n.target)
      .toSorted((a, b) => a.target.y - b.target.y);
    for (const note of placed) {
      const { x, y, w, h } = note.target;
      const pad = 5;
      const highlight = rect({ x: shotX + x - pad, y: top + y - pad, w: w + pad * 2, h: h + pad * 2, color });

      const cardY = Math.max(cursor, top + y + h / 2 - 30);
      const box = card({ right, y: cardY, value: note.text, color });
      // From the card's left edge to the highlight's right edge; a target on the shot's far (left) side near the top is
      // reached over the shot's top edge instead, so the arrow doesn't cut across the screen.
      const start = [box.x - 4, box.y + box.height / 2];
      const overTop = x + w < 150 && y < 120;
      arrow({
        points: overTop
          ? [start, [shotX + x + w / 2 + 80, top - 40], [highlight.x + highlight.width / 2, highlight.y - 4]]
          : [start, [highlight.x + highlight.width + 4, highlight.y + highlight.height / 2]],
        color,
        from: box,
        to: highlight,
      });
      cursor = cardY + box.height + 24;
    }

    return { shotX, top, right, height: shot.height, bottom: Math.max(top + shot.height, cursor) };
  }

  /** The big "next page" arrow, with what the person does written over it. */
  function nextArrow({ from, to, y, label, color = INK }) {
    arrow({ points: [[from, y], [to, y]], color, width: 8, head: "triangle" });
    text({ right: from - 10, y: y - 64, value: label, size: 26, color, width: from - to - 20 });
  }

  /**
   * The curved arrow down to a step on the next row (a second path, or the Admin's side), with its label.
   *
   * @param from The step it leaves, as `step` returned it.
   * @param to The step it reaches, on the row below.
   */
  function turnArrow({ from, to, label, color }) {
    arrow({
      points: [
        [from.shotX + SHOT_WIDTH / 2, from.top + from.height + 30],
        [from.shotX - 90, to.top - 250],
        [to.right + 60, to.top + 60],
      ],
      color,
      width: 8,
      head: "triangle",
    });
    text({ right: from.shotX - 120, y: to.top - 335, value: label, size: 26, color, width: 360 });
  }

  /*===== Write =====*/
  /** Writes the scene to `out` (default `excalidraw/<name>.excalidraw`) and closes the image browser. */
  async function write(out = `excalidraw/${name}.excalidraw`) {
    if (browser) await browser.close();
    const scene = {
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements,
      appState: { viewBackgroundColor: "#ffffff", gridSize: 20, gridStep: 5 },
      files,
    };
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(scene));
    console.log(`${out}: ${elements.length} elements, ${(JSON.stringify(scene).length / 1e6).toFixed(2)} MB`);
  }

  return { shots, text, rect, arrow, card, image, verification, header, step, nextArrow, turnArrow, write };
}
