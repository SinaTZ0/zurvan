// Shared by the day/night page (design 4) and the night-only palette page (design 5). Every colour is a `--st-*`
// custom property, so a palette is just a set of overrides on the root's inline style (which beats this stylesheet).
// `--st-red` is the main action's colour (gold on the night palettes) and `--st-on-red` its text; `--st-dim` is the
// night filter on the scenery.

/*===== Tokens =====*/
// Paper grain is a tiny tiled SVG noise at 7% opacity: cheap, and it keeps the flat paper from looking digital.
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.07'/%3E%3C/svg%3E\")";

// Day is the storybook's paper; night is the same book read under a lamp: warm charcoal-brown, olive bands, cream
// ink. The dog keeps its own colours in both, so it is the brightest thing on the night page. White on the night red
// (#B8463A) is 5.2:1.
const DAY = `
  --st-paper: #F3ECDD; --st-paper-2: #EDE4D0; --st-sage: #C9CFB0; --st-sage-2: #D6DBC0; --st-sage-deep: #6F7F52;
  --st-ink: #2A2620; --st-red: #A63D30; --st-on-red: #FFFFFF; --st-red-deep: #8E3125; --st-mustard: #D3A84A;`;
const NIGHT = `
  --st-paper: #2A221B; --st-paper-2: #362C23; --st-sage: #3B3927; --st-sage-2: #45432E; --st-sage-deep: #AEB985;
  --st-ink: #F1E4CF; --st-red: #B8463A; --st-on-red: #FFFFFF; --st-red-deep: #C9584B; --st-mustard: #D9B25A;`;

// The theme follows the visitor's system until they pick one with the header switch. With no `data-theme`, the media
// query decides, so the server render already matches the system and there is no flash. `.st-day`/`.st-night` show an
// element in one theme only (the night foliage, the switch's icon).
// Treatment tokens: by default they follow the page's ink and bands, and a style can point any of them at gold.
// Declared on the root, so each resolves to the root's final colour and is inherited as that colour.
const TREATMENTS = `
  --st-line: var(--st-ink); --st-bubble-line: var(--st-ink); --st-bubble-ink: var(--st-ink);
  --st-badge: var(--st-sage); --st-badge-ink: var(--st-ink);
  --st-close: var(--st-sage); --st-close-ink: var(--st-ink); --st-close-bubble: var(--st-bubble-line);
  --st-close-btn: var(--st-red); --st-close-btn-hover: var(--st-red-deep); --st-close-btn-ink: var(--st-on-red);
  --st-close-dim: var(--st-dim, brightness(.72) saturate(.9));`;

export const THEME_CSS = `
  .st-root { ${DAY} ${TREATMENTS} color-scheme: light; }
  .st-root .st-night { display: none; }
  @media (prefers-color-scheme: dark) {
    .st-root:not([data-theme="light"]) { ${NIGHT} color-scheme: dark; }
    .st-root:not([data-theme="light"]) .st-day { display: none; }
    .st-root:not([data-theme="light"]) .st-night { display: revert; }
    .st-root:not([data-theme="light"]) .st-dim { filter: var(--st-dim, brightness(.72) saturate(.9)); }
  }
  .st-root[data-theme="dark"] { ${NIGHT} color-scheme: dark; }
  .st-root[data-theme="dark"] .st-day { display: none; }
  .st-root[data-theme="dark"] .st-night { display: revert; }
  .st-root[data-theme="dark"] .st-dim { filter: var(--st-dim, brightness(.72) saturate(.9)); }
`;
