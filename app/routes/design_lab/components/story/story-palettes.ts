/*===== Palette =====*/
/** One night look for the storybook page: overrides of the `--st-*` tokens (story-theme), with a name for the picker. */
export type Palette = { name: string; hint: string; tokens: Record<`--st-${string}`, string> };

/*===== Night Palettes =====*/
// Five black-and-gold takes for the night-only storybook, each a step away from the live site (pure black, flat amber
// #F5B83D). Gold stays on the actions, icons and small accents, never on headlines (headlines read as a bullion
// shop in gold), and the blacks stay off warm brown (brown black with mustard was turned down before). Every gold
// button carries dark text at 8:1 or more. `--st-sage` is the bands' colour, `--st-sage-deep` the icons'.
export const NIGHT_PALETTES: readonly Palette[] = [
  {
    name: "شامپاین",
    hint: "مشکی خنثی، طلای روشن و نرم",
    tokens: {
      "--st-paper": "#141414",
      "--st-paper-2": "#1D1D1D",
      "--st-sage": "#232323",
      "--st-sage-2": "#2B2B2B",
      "--st-sage-deep": "#E6CC8F",
      "--st-ink": "#F4EEE2",
      "--st-red": "#E6CC8F",
      "--st-red-deep": "#F0DAA6",
      "--st-on-red": "#1A160C",
      "--st-mustard": "#E6CC8F",
      "--st-dim": "brightness(.6) saturate(.7)",
    },
  },
  {
    name: "زعفران",
    hint: "گرافیتی، طلای زرد و پرنور",
    tokens: {
      "--st-paper": "#17181B",
      "--st-paper-2": "#212226",
      "--st-sage": "#2A2B30",
      "--st-sage-2": "#323338",
      "--st-sage-deep": "#FFC21A",
      "--st-ink": "#FAF7F0",
      "--st-red": "#FFC21A",
      "--st-red-deep": "#FFD14F",
      "--st-on-red": "#1A1300",
      "--st-mustard": "#FFC21A",
      "--st-dim": "brightness(.6) saturate(.65)",
    },
  },
  {
    name: "سرمه",
    hint: "سرمه‌ای شب، طلای برنجی",
    tokens: {
      "--st-paper": "#0D1626",
      "--st-paper-2": "#15223A",
      "--st-sage": "#1A2B47",
      "--st-sage-2": "#213454",
      "--st-sage-deep": "#D9AE52",
      "--st-ink": "#F1EBDD",
      "--st-red": "#D9AE52",
      "--st-red-deep": "#E6C171",
      "--st-on-red": "#0D1626",
      "--st-mustard": "#D9AE52",
      "--st-dim": "brightness(.55) saturate(.6)",
    },
  },
  {
    // Lapis and gold are the colours of Persian manuscript illumination (tazhib); turquoise is its small accent.
    name: "لاجورد",
    hint: "آبی لاجوردی، طلای تذهیب، کمی فیروزه",
    tokens: {
      "--st-paper": "#0C1738",
      "--st-paper-2": "#142451",
      "--st-sage": "#1A2D66",
      "--st-sage-2": "#213672",
      "--st-sage-deep": "#E2B857",
      "--st-ink": "#F5EEDC",
      "--st-red": "#E2B857",
      "--st-red-deep": "#EDCA7A",
      "--st-on-red": "#0C1738",
      "--st-mustard": "#5FBFB6",
      "--st-dim": "brightness(.55) saturate(.6)",
    },
  },
  {
    name: "جنگل شب",
    hint: "سبزِ تقریباً سیاه، طلای کهنه",
    tokens: {
      "--st-paper": "#0E1714",
      "--st-paper-2": "#15211D",
      "--st-sage": "#1B2C26",
      "--st-sage-2": "#22362F",
      "--st-sage-deep": "#CFA857",
      "--st-ink": "#EFE8D6",
      "--st-red": "#CFA857",
      "--st-red-deep": "#DDBC74",
      "--st-on-red": "#0E1714",
      "--st-mustard": "#CFA857",
      "--st-dim": "brightness(.68) saturate(.85)",
    },
  },
];

/*===== Gold Styles =====*/
// Six takes on one pairing, neutral black and bright yellow gold (the owner's pick from the five palettes, 2026-10-20).
// The colours barely move, so most styles change where the gold goes: the dog's bubbles, the lines, a solid band.
// Big gold on the first screen still reads as a bullion shop, so the hero never turns gold.
const GOLD = "#FFC21A";
const BLACK_AND_GOLD = {
  "--st-paper": "#141414",
  "--st-paper-2": "#1D1D1D",
  "--st-sage": "#232323",
  "--st-sage-2": "#2B2B2B",
  "--st-sage-deep": GOLD,
  "--st-ink": "#F4EEE2",
  "--st-red": GOLD,
  "--st-red-deep": "#FFD14F",
  "--st-on-red": "#1A1300",
  "--st-mustard": GOLD,
  "--st-dim": "brightness(.6) saturate(.65)",
};

export const GOLD_STYLES: readonly Palette[] = [
  { name: "ساده", hint: "طلا فقط روی دکمه‌ها و آیکون‌ها", tokens: BLACK_AND_GOLD },
  {
    name: "گچ طلایی",
    hint: "حرف‌های فندق با گچ طلایی",
    tokens: { ...BLACK_AND_GOLD, "--st-bubble-line": GOLD, "--st-bubble-ink": GOLD },
  },
  {
    name: "خط طلایی",
    hint: "کادرها، خط‌ها و قاب عکس طلایی",
    tokens: { ...BLACK_AND_GOLD, "--st-line": GOLD },
  },
  {
    // White on this gold fails contrast, so the band's text and button turn black; its plants are left undimmed.
    name: "نوار طلایی",
    hint: "نوار پایانی یکپارچه طلایی، شماره‌ها طلایی",
    tokens: {
      ...BLACK_AND_GOLD,
      "--st-badge": GOLD,
      "--st-badge-ink": "#141414",
      "--st-close": GOLD,
      "--st-close-ink": "#141414",
      "--st-close-bubble": "#141414",
      "--st-close-btn": "#141414",
      "--st-close-btn-hover": "#2B2B2B",
      "--st-close-btn-ink": GOLD,
      "--st-close-dim": "none",
    },
  },
  {
    name: "پرکنتراست",
    hint: "مشکی عمیق‌تر، متن سفید، طلای لیمویی",
    tokens: {
      ...BLACK_AND_GOLD,
      "--st-paper": "#0E0E0E",
      "--st-paper-2": "#181818",
      "--st-sage": "#1C1C1C",
      "--st-sage-2": "#242424",
      "--st-sage-deep": "#FFD000",
      "--st-ink": "#FFFFFF",
      "--st-red": "#FFD000",
      "--st-red-deep": "#FFDD40",
      "--st-on-red": "#141000",
      "--st-mustard": "#FFD000",
      "--st-badge": "#FFD000",
      "--st-badge-ink": "#0E0E0E",
    },
  },
  {
    name: "زغالی نرم",
    hint: "زغالی روشن‌تر، طلای ملایم‌تر، گچ طلایی",
    tokens: {
      ...BLACK_AND_GOLD,
      "--st-paper": "#1E1E1E",
      "--st-paper-2": "#282828",
      "--st-sage": "#2C2C2C",
      "--st-sage-2": "#343434",
      "--st-sage-deep": "#FFC933",
      "--st-ink": "#F2EDE4",
      "--st-red": "#FFC933",
      "--st-red-deep": "#FFD65C",
      "--st-on-red": "#1E1700",
      "--st-mustard": "#FFC933",
      "--st-bubble-line": "#FFC933",
      "--st-bubble-ink": "#FFC933",
      "--st-dim": "brightness(.65) saturate(.7)",
    },
  },
];
