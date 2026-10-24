import { type Locale, textDirection } from "~/lib/i18n";
import { PWA_COLOR } from "~/lib/pwa";
import { m } from "~/paraglide/messages";

/*===== Offline Document =====*/
// The page the service worker (`public/sw.js`) shows when a page can't load. It is plain HTML with its CSS inline,
// because the worker keeps it for when there is no network: the app's bundles have hashed names the worker can't know,
// so the page uses only the files the worker precaches by name (its `OFFLINE_FILES`, which must list every URL below).
// The fonts under `/pwa/fonts/` are copies of the site's for the same reason.
//
// The look is the storefront's (docs/storefront-design.md, "Offline"): the paper and its grain, the dog sitting on a
// chalk line with the plug of the cable he pulled in his mouth, the empty socket at the line's far end, his chalk
// bubble, and the gold pill. He faces right in the picture, so the Persian page has him on the left with the bubble
// before his nose; the English page mirrors the scene.

const DOG = { src: "/photo/new-design/offline.webp", width: 304, height: 460 };

// The same noise tile as `--grain` in `app/app.css`.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.07'/%3E%3C/svg%3E\")";

/** Escapes text for HTML (the messages are plain text, but nothing goes into markup unescaped). */
function escape(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/*===== Styles =====*/
// The colours are the tokens of `app/app.css` (`--base`, `--foreground`, `--muted-foreground`, `--primary`…), and the
// bubble copies `ChalkBubble` (`app/components/chalk-bubble.tsx`).
const STYLES = `
@font-face {
  font-family: "Vazirmatn Variable";
  font-weight: 100 900;
  font-display: swap;
  src: url(/pwa/fonts/vazirmatn-arabic-wght-normal.woff2) format("woff2-variations");
  unicode-range: U+0600-06FF, U+0750-077F, U+200C-200E, U+2010-2011, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: "Vazirmatn Variable";
  font-weight: 100 900;
  font-display: swap;
  src: url(/pwa/fonts/vazirmatn-latin-wght-normal.woff2) format("woff2-variations");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122;
}
@font-face {
  font-family: "Marhey";
  font-weight: 300 700;
  font-display: swap;
  src: url(/pwa/fonts/marhey-vf.woff2) format("woff2-variations");
}

:root {
  color-scheme: dark;
  --paper: ${PWA_COLOR};
  --ink: #f4eee2;
  --muted: #a8a297;
  --gold: #ffc21a;
  --gold-hover: #ffd14f;
  --on-gold: #1a1300;
  --chalk: rgb(244 238 226 / 0.55);
}

*, *::before, *::after { box-sizing: border-box; }

html, body { margin: 0; }

body {
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--paper);
  background-image: ${GRAIN};
  color: var(--ink);
  font-family: "Vazirmatn Variable", Tahoma, sans-serif;
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}

/*------ Page ------*/
.page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: max(1.25rem, env(safe-area-inset-top)) 1rem max(2rem, env(safe-area-inset-bottom));
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  font-size: 1.125rem;
}
.brand img { width: 2.25rem; height: 2.25rem; }

.body {
  flex: 1;
  width: 100%;
  max-width: 34rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-block: 2rem;
}

/*------ Scene ------*/
/* Laid out left to right whatever the language: the dog's picture faces right. */
.scene {
  position: relative;
  width: 100%;
  direction: ltr;
}

.stage {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0.25rem;
  /* The warm light he sits in. */
  background: radial-gradient(ellipse 45% 55% at 38% 92%, rgb(255 194 26 / 0.08), transparent);
}

.dog {
  display: block;
  width: 10.5rem;
  height: auto;
  /* The cut-out's soft feet sink into the chalk line. */
  margin-bottom: -6px;
  position: relative;
  z-index: 1;
}

.bubble {
  position: relative;
  margin: 1.25rem 0 0;
  max-width: 10.5rem;
  padding: 0.625rem 1rem;
  border: 2px solid var(--ink);
  border-radius: 1.4rem;
  background: var(--paper);
  font-family: "Marhey", "Vazirmatn Variable", sans-serif;
  font-size: 15px;
  line-height: 1.45;
}
.bubble[dir="rtl"] { text-align: right; }
.bubble .tail {
  position: absolute;
  bottom: -9px;
  left: 1.25rem;
  width: 1rem;
  height: 1rem;
  border-right: 2px solid var(--ink);
  border-bottom: 2px solid var(--ink);
  background: var(--paper);
  transform: rotate(45deg);
}

.ground {
  display: block;
  width: 100%;
  height: 14px;
  color: var(--chalk);
}

/* The socket he pulled the plug from, at the far end of the line behind him. */
.socket {
  position: absolute;
  left: 0.25rem;
  bottom: 10px;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--chalk);
}

/* English: the same scene, mirrored. */
.scene.mirrored .stage {
  flex-direction: row-reverse;
  background: radial-gradient(ellipse 45% 55% at 62% 92%, rgb(255 194 26 / 0.08), transparent);
}
.scene.mirrored .dog { transform: scaleX(-1); }
.scene.mirrored .bubble .tail { left: auto; right: 1.25rem; }
.scene.mirrored .socket { left: auto; right: 0.25rem; }
.scene.mirrored .ground { transform: scaleX(-1); }

/*------ Words ------*/
h1 {
  margin: 2rem 0 0;
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.4;
  text-align: center;
}

.line {
  margin: 0.5rem 0 0;
  max-width: 26rem;
  color: var(--muted);
  text-align: center;
}

.retry {
  margin-top: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.75rem;
  border: 0;
  border-radius: 999px;
  background: var(--gold);
  color: var(--on-gold);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 150ms;
}
.retry:hover { background: var(--gold-hover); }
.retry:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px; }

/*------ Larger screens ------*/
@media (min-width: 768px) {
  .dog { width: 14rem; }
  .bubble { max-width: 15rem; margin-top: 2rem; font-size: 18px; }
  .socket { width: 3.5rem; height: 3.5rem; left: 1.5rem; }
  .scene.mirrored .socket { right: 1.5rem; }
  h1 { font-size: 2.25rem; }
  .line { font-size: 1.0625rem; }
}
`;

/*===== Drawings =====*/
// A hand-drawn chalk line: a few gentle wobbles, stretched to the scene's width.
const GROUND_SVG = `<svg class="ground" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 C 40 5, 70 10, 110 7 S 190 5, 230 8 S 320 10, 360 6 S 392 8, 398 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;

// A wall socket on a little floor box, drawn in the same chalk: the round plate and its two empty holes.
const SOCKET_SVG = `<svg class="socket" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 44.5 L6 9.5 Q6 5.5 10 5.6 L38.5 5.2 Q42.4 5.4 42.2 9.4 L42.6 44.6"/><circle cx="24.2" cy="24.6" r="11.2"/><circle cx="19.6" cy="24.8" r="1.6" fill="currentColor"/><circle cx="28.8" cy="24.4" r="1.6" fill="currentColor"/></svg>`;

/*===== Document =====*/
/** The whole offline page in a language, as one HTML string. */
export function offlineDocument(locale: Locale): string {
  const t = (message: (inputs: object, options: { locale: Locale }) => string) => escape(message({}, { locale }));
  const dir = textDirection(locale);
  const mirrored = locale === "en";

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${PWA_COLOR}">
<meta name="robots" content="noindex">
<title>${t(m.pwa_offline_meta_title)}</title>
<link rel="icon" href="/brand/k9-logo-128.webp">
<style>${STYLES}</style>
</head>
<body>
<main class="page">
  <div class="brand"><img src="/brand/k9-logo-128.webp" alt="" width="128" height="128"><span>${t(m.shared_brand_name)}</span></div>

  <div class="body">
    <div class="scene${mirrored ? " mirrored" : ""}">
      <div class="stage">
        <img class="dog" src="${DOG.src}" alt="" width="${DOG.width}" height="${DOG.height}">
        <p class="bubble" dir="${dir}">${t(m.pwa_offline_bubble)}<span class="tail" aria-hidden="true"></span></p>
      </div>
      ${SOCKET_SVG}
      ${GROUND_SVG}
    </div>

    <h1>${t(m.pwa_offline_title)}</h1>
    <p class="line">${t(m.pwa_offline_body)}</p>
    <button class="retry" type="button">${t(m.pwa_offline_retry)}</button>
  </div>
</main>
<script>
  // Retry, and reload by itself once the connection is back (the page it stands in for is at this same address).
  document.querySelector(".retry").addEventListener("click", function () { location.reload(); });
  window.addEventListener("online", function () { location.reload(); });
</script>
</body>
</html>`;
}
