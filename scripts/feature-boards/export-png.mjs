// Exports a .excalidraw file to PNG through excalidraw.com's own export dialog.
// Usage: node scripts/feature-boards/export-png.mjs <file.excalidraw> <out.png> <scale 1|2|3>
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const [file, out, scale = "2"] = process.argv.slice(2);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
// Headless Chromium can't show the save picker: a stand-in hands back a writable that keeps the exported blob.
await context.addInitScript(() => {
  window.showSaveFilePicker = async () => ({
    name: "board.png",
    createWritable: async () => ({
      write: async (data) => { window.__exported = data instanceof Blob ? data : new Blob([data]); },
      close: async () => {},
    }),
  });
});
const page = await context.newPage();
await page.goto("https://excalidraw.com", { waitUntil: "networkidle" });
await page.waitForSelector("canvas.interactive");
await page.evaluate((text) => {
  const dt = new DataTransfer();
  dt.items.add(new File([text], "board.excalidraw", { type: "application/json" }));
  const target = document.querySelector("canvas.interactive");
  for (const type of ["dragenter", "dragover", "drop"])
    target.dispatchEvent(new DragEvent(type, { dataTransfer: dt, bubbles: true, cancelable: true, clientX: 600, clientY: 600 }));
}, readFileSync(file, "utf8"));
await page.waitForTimeout(4000);

/*------ Export dialog ------*/
await page.mouse.click(10, 500);
await page.keyboard.press("Control+Shift+E");
await page.waitForTimeout(1500);
await page.getByRole("radio", { name: new RegExp(`^${scale}×$`) }).or(page.getByText(`${scale}×`, { exact: true })).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: out.replace(/\.png$/, "-dialog.png") });
page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
await page.getByRole("button", { name: /PNG/ }).first().click();
await page.waitForFunction(() => window.__exported, null, { timeout: 120000 });
const base64 = await page.evaluate(async () => {
  const buf = new Uint8Array(await window.__exported.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
});
writeFileSync(out, Buffer.from(base64, "base64"));
console.log("saved", out);
await browser.close();
