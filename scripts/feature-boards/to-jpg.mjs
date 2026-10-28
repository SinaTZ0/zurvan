// Writes a JPEG copy of a PNG (the board's preview) and a full-resolution crop, for checking a part at full size.
// Usage: node scripts/feature-boards/to-jpg.mjs in.png out.jpg crop.jpg x y w h
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
const [input, jpg, crop, x, y, w, h] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage();
const [full, part] = await p.evaluate(async ({ src, x, y, w, h }) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0);
  const d = document.createElement("canvas");
  d.width = w; d.height = h;
  d.getContext("2d").drawImage(c, x, y, w, h, 0, 0, w, h);
  return [c.toDataURL("image/jpeg", 0.85), d.toDataURL("image/jpeg", 0.9)];
}, { src: "data:image/png;base64," + readFileSync(input).toString("base64"), x: +x, y: +y, w: +w, h: +h });
writeFileSync(jpg, Buffer.from(full.split(",")[1], "base64"));
writeFileSync(crop, Buffer.from(part.split(",")[1], "base64"));
await b.close();
