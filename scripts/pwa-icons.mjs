// Makes the installed app's icons (`public/pwa/icon-*.png`) from the gold emblem. Run it again with the owner's original
// emblem when it arrives: `node scripts/pwa-icons.mjs path/to/emblem.png`. The default source, the 256px emblem the site
// uses, is upscaled to 512 and 1024, so those are soft until then. See docs/mobile-app.md.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname;
const source = process.argv[2] ?? join(root, "public/brand/k9-logo-256.webp");
const out = join(root, "public/pwa");
// The paper (`PWA_COLOR` in `app/lib/pwa.ts`).
const PAPER = "#141414";

mkdirSync(out, { recursive: true });

/*===== Plain Icons =====*/
// The emblem for the browser's install prompt and the TWA's launcher icon. The ring's inside is transparent in the
// source, so a disc of paper goes behind it: on a light wallpaper or a white install dialog the emblem would look hollow.
for (const size of [192, 512]) {
  const r = size * 0.48;
  const disc = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${PAPER}"/></svg>`,
  );
  const emblem = await sharp(source)
    .resize(size, size, { fit: "contain", kernel: "lanczos3", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(disc)
    .composite([{ input: emblem }])
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(join(out, `icon-${size}.png`));
}

/*===== Maskable Icon =====*/
// Android crops a maskable icon to its own shape (a circle, a squircle), keeping only the middle 80% for sure, so the
// emblem sits at 60% on a full square of paper.
const MASKABLE = 512;
const emblem = Math.round(MASKABLE * 0.6);
const inner = await sharp(source)
  .resize(emblem, emblem, { fit: "contain", kernel: "lanczos3", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({ create: { width: MASKABLE, height: MASKABLE, channels: 4, background: PAPER } })
  .composite([{ input: inner, gravity: "center" }])
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toFile(join(out, "icon-maskable-512.png"));

console.log(`pwa-icons: wrote ${out}/icon-{192,512,maskable-512}.png from ${source}`);
