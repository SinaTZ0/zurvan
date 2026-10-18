/*===== Printable QR =====*/
const PNG_SIDE = 1024;
const CAPTION_HEIGHT = 160;

/**
 * Saves the QR and its caption as a PNG the partner can print. Runs in the browser only: the SVG path is drawn on a
 * white canvas (the quiet zone is inside the path), then the caption under it, then the canvas is downloaded.
 *
 * Rejects if the image can't be decoded or the canvas can't be exported; the caller decides what to say.
 */
export async function downloadQrPng({
  path,
  size,
  caption,
  fileName,
}: {
  /** The SVG path from the loader. */
  path: string;
  /** The `viewBox` side in modules. */
  size: number;
  caption: string;
  fileName: string;
}): Promise<void> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><path fill="#000" d="${path}"/></svg>`;
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));

  try {
    const image = new Image(PNG_SIDE, PNG_SIDE);
    image.src = svgUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = PNG_SIDE;
    canvas.height = PNG_SIDE + CAPTION_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");

    // White under the code: printed on a dark card the code would not scan, and the PNG is for printing anyway.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, PNG_SIDE, PNG_SIDE);

    context.fillStyle = "#000";
    context.direction = "rtl";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "700 56px Estedad, Vazirmatn Variable, sans-serif";
    context.fillText(caption, PNG_SIDE / 2, PNG_SIDE + CAPTION_HEIGHT / 2);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("png export failed");

    const pngUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
