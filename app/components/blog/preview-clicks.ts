/*===== Preview Clicks =====*/
/**
 * The click guard of the Admin's preview, put on the previewed article in the capture phase: no link in it may leave the
 * unsaved form, so every link click is stopped before the router's `Link` or the browser sees it (the router's `Link`
 * leaves a click that is already `defaultPrevented` alone). A link to a heading of the post (`#section-2`) still
 * scrolls to it inside the preview. Buttons (a figure's lightbox) work as usual.
 */
export function stopPreviewLinks(event: React.MouseEvent) {
  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  if (!anchor) return;

  event.preventDefault();
  const href = anchor.getAttribute("href") ?? "";
  if (href.startsWith("#")) {
    document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
