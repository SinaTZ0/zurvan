// Builds the sign-in / sign-up journey board as an Excalidraw scene from the shots and boxes that
// 01-sign-in.capture.mjs recorded. Usage: node scripts/feature-boards/01-sign-in.board.mjs [out.excalidraw]
// Scene units are the shots' CSS pixels (the PNGs are DPR 2, so they stay sharp when zoomed in).
// The board is for the site's owner: short notes in plain Persian, no addresses or technical terms.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";

const OUT = process.argv[2] ?? "excalidraw/01-sign-in.excalidraw";
const SHOTS = ".tmp-claude/feature-boards/01-sign-in/shots";
const { shots } = JSON.parse(readFileSync(`${SHOTS}/shots.json`, "utf8"));

/*===== Style =====*/
const INK = "#1e1e1e";
const MUTED = "#868e96";
const CALLOUT = "#e03131"; // highlights, note cards and their arrows
const RETURNING = "#2f9e44"; // the returning customer's branch
const ADMIN = "#1971c2"; // the Admin's side
// Light card fills, one per colour.
const TINT = { [CALLOUT]: "#fff5f5", [RETURNING]: "#ebfbee", [ADMIN]: "#e7f5ff" };
const FONT = 5; // Excalifont; Persian falls back to the system's Arabic-script font
const NOTE_SIZE = 20;
const NOTE_WIDTH = 280; // the widest a note card gets
const CARD_PAD = 14;
const SHOT_WIDTH = 390;
const NOTES_GAP = 70; // between a shot's right edge and its notes column
const STEP_GAP = 460; // between one step's shot and the next step's notes: room for the big arrow
const PITCH = SHOT_WIDTH + NOTES_GAP + NOTE_WIDTH + STEP_GAP;

/*===== Element Factory =====*/
let seq = 0;
const elements = [];
const files = {};
const now = Date.now();
const rand = () => Math.floor(Math.random() * 2 ** 31);

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

/**
 * Rough width of a line: Persian glyphs average about half the font size. Excalidraw keeps the stored width and clips
 * the last letter when it's short, so the box is measured wide; right-aligned text doesn't mind the spare room.
 */
const lineWidth = (line, size) => Math.ceil(line.length * size * 0.56) + 8;

/** Wraps on spaces to a column width; "\n" in the source forces a break. */
function wrap(text, size, width) {
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

/** Records an arrow on a shape, so the shape knows what is attached to it. */
function attach(shape, arrowId) {
  shape.boundElements = [...(shape.boundElements ?? []), { id: arrowId, type: "arrow" }];
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
// PNG → JPEG through Chromium's canvas, to keep the board light.
const browser = await chromium.launch();
const page = await browser.newPage();
async function jpegDataUrl(name) {
  const src = `data:image/png;base64,${readFileSync(`${SHOTS}/${name}.png`).toString("base64")}`;
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

async function image({ name, x, y }) {
  const shot = shots[name];
  const fileId = `shot-${name}`;
  files[fileId] = { mimeType: "image/jpeg", id: fileId, dataURL: await jpegDataUrl(name), created: now, lastRetrieved: now };
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

/*===== Step =====*/
/**
 * One page of the journey: its title, the screenshot, and a notes column on the shot's right (read first in RTL), each
 * note a card attached by an arrow to a highlighted part of the screen. A note's `box` is a recorded target, or `area`
 * gives CSS px by hand. Returns the step's geometry for the arrows between steps.
 */
async function step({ name, col, top, number, title, notes, color = CALLOUT, titleColor = INK }) {
  const right = -col * PITCH; // the notes column's right edge
  const shotX = right - NOTE_WIDTH - NOTES_GAP - SHOT_WIDTH;
  const shot = shots[name];

  text({ right, y: top - 70, value: `${number}. ${title}`, size: 34, color: titleColor, width: 800 });
  await image({ name, x: shotX, y: top });

  /*------ Notes ------*/
  let cursor = top;
  const placed = notes
    .map((n) => ({ ...n, target: n.area ?? shot.boxes[n.box] }))
    .filter((n) => n.target)
    .sort((a, b) => a.target.y - b.target.y);
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

/*===== Board =====*/
const ROW1 = 0;

/*------ Title and key ------*/
text({ right: 0, y: -330, value: "ورود و ثبت‌نام در سایت (موبایل)", size: 52, width: 1400 });
text({
  right: 0,
  y: -250,
  width: 1400,
  size: 26,
  color: "#495057",
  value: "ورود و ثبت‌نام یکیه: شماره‌ی موبایل، بعد کد پیامکی. فقط بار اول اسم هم پرسیده می‌شه.",
});
text({ right: 0, y: -190, value: "سبز: مشتری قدیمی", size: 24, color: RETURNING, width: 400 });
text({ right: -260, y: -190, value: "آبی: پنل مدیریت", size: 24, color: ADMIN, width: 400 });

/*------ 1. Home ------*/
const s1 = await step({
  name: "01-home",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "صفحه‌ی اصلی",
  notes: [{ box: "account", text: "ورود یا ثبت‌نام" }],
});

/*------ 2. Phone ------*/
const s2 = await step({
  name: "02-phone",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "شماره‌ی موبایل",
  notes: [
    { box: "stage", text: "سگ هر مرحله سؤالش رو می‌پرسه" },
    // The recorded box is the bare input; the field also holds the phone icon, so take the button's width.
    { area: { ...shots["02-phone"].boxes.phone, x: 37, w: 316 }, text: "فقط شماره‌ی موبایل" },
    { box: "password", text: "یا ورود با رمز، اگه از قبل رمز گذاشته باشه" },
    { box: "demo", text: "حساب‌های نمونه؛ فقط در نسخه‌ی نمایشی" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 320, label: "دکمه‌ی ورود" });

/*------ 3. Code ------*/
const s3 = await step({
  name: "03-code",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "کد پیامکی",
  notes: [
    { box: "otp", text: "کد ۵ رقمی که پیامک می‌شه" },
    { box: "hint", text: "نسخه‌ی نمایشی: کد همیشه ۱۲۳۴۵" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 640, label: "«کد ورود رو بفرست»" });

/*------ 4. Name (a new number only) ------*/
const name = shots["04-name"].boxes;
const s4 = await step({
  name: "04-name",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "اسم (فقط بار اول)",
  notes: [
    {
      area: { x: name.first.x, y: name.first.y, w: name.first.w, h: name.last.y + name.last.h - name.first.y },
      text: "حساب ساخته شد؛ فقط اسمش مونده",
    },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 640, label: "شماره‌ی تازه" });

/*------ 5. The new customer's account ------*/
const s5 = await step({
  name: "05-account-new",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "حساب مشتری تازه",
  notes: [
    { box: "heading", text: "خوش‌آمد با اسم خودش" },
    { area: { x: 16, y: 495, w: 358, h: 250 }, text: "قدم بعد: معرفی سگ" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 640, label: "«ادامه»" });

/*------ Row 2 ------*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom) + 420;

/*------ 6. A returning customer ------*/
const s6 = await step({
  name: "06-account-returning",
  col: 3,
  top: ROW2,
  number: "۶",
  title: "مشتری قدیمی",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [{ box: "heading", text: "بدون پرسیدن اسم، مستقیم به حسابش" }],
});
// From the code step, down and left past the name step.
arrow({
  points: [
    [s3.shotX + SHOT_WIDTH / 2, s3.top + s3.height + 30],
    [s3.shotX - 80, ROW2 - 260],
    [s6.right + 60, ROW2 + 60],
  ],
  color: RETURNING,
  width: 8,
  head: "triangle",
});
text({ right: s3.shotX - 110, y: ROW2 - 340, value: "شماره‌ی قبلی", size: 26, color: RETURNING, width: 360 });

/*------ 7. The Admin's side ------*/
const s7 = await step({
  name: "07-admin-users",
  col: 5,
  top: ROW2,
  number: "۷",
  title: "پنل مدیریت: کاربران",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [{ area: { x: 16, y: 385, w: 358, h: 78 }, text: "مشتری تازه همون لحظه اینجاست" }],
});
// The Admin turn: down and left from the new account.
arrow({
  points: [
    [s5.shotX + SHOT_WIDTH / 2, s5.top + s5.height + 30],
    [s5.shotX - 100, ROW2 - 240],
    [s7.right + 60, ROW2 + 60],
  ],
  color: ADMIN,
  width: 8,
  head: "triangle",
});
text({ right: s5.shotX - 130, y: ROW2 - 330, value: "پنل مدیریت", size: 26, color: ADMIN, width: 300 });

await browser.close();

/*===== Write =====*/
const scene = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements,
  appState: { viewBackgroundColor: "#ffffff", gridSize: 20, gridStep: 5 },
  files,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(scene));
console.log(`${OUT}: ${elements.length} elements, ${(JSON.stringify(scene).length / 1e6).toFixed(2)} MB`);
