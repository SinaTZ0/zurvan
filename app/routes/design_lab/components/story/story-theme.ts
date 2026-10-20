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

/*===== Lively =====*/
// Design 7's idle motion. The classes are added in the shared components but only move under `.st-lively` (the root
// of design 7), so designs 4-6 stay still. Every loop is long and small, so the page feels alive without nagging, and
// the whole block is off for reduced motion. The keyframes animate `transform`, which composes with Tailwind's own
// `translate`/`rotate`/`scale` properties instead of replacing them, so a flipped cut-out stays flipped.
export const LIVELY_CSS = `
  @media (prefers-reduced-motion: no-preference) {
    /*------ Scenery ------*/
    .st-lively .st-sway { transform-origin: 50% 100%; animation: st-sway 5.5s ease-in-out infinite alternate; }
    .st-lively .st-sway-2 { transform-origin: 50% 100%; animation: st-sway 4.2s ease-in-out -2s infinite alternate-reverse; }

    /*------ The dog ------*/
    .st-lively .st-wiggle { transform-origin: 50% 100%; animation: st-wiggle 6s ease-in-out infinite; }
    .st-lively .st-wiggle-late { transform-origin: 50% 100%; animation: st-wiggle 7s ease-in-out -3.5s infinite; }
    .st-lively .st-tilt { transform-origin: 50% 90%; animation: st-tilt 5s ease-in-out infinite; }
    .st-lively .st-twitch { transform-origin: 50% 100%; animation: st-twitch 4s ease-in-out infinite; }
    .st-lively .st-swing { transform-origin: 50% 0; animation: st-swing 3.2s ease-in-out infinite alternate; }
    .st-lively .st-hop { transform-origin: 50% 100%; animation: st-hop 2.8s cubic-bezier(.3,.7,.4,1) infinite; }
    .st-lively .st-breathe { transform-origin: 50% 100%; animation: st-breathe 2.6s ease-in-out infinite; }
    .st-lively .st-ticks { animation: st-ticks 1.4s ease-in-out infinite; }
    /* Petting: hovering a dog makes him wriggle, whatever his idle loop is. One soft wriggle, then a rest, so a
       resting cursor doesn't keep him shaking. */
    .st-lively .st-pet { pointer-events: auto; }
    .st-lively .st-pet:hover { transform-origin: 50% 100%; animation: st-pet 2.6s ease-in-out infinite; }

    /*------ Bubbles and cards ------*/
    .st-lively .st-float { animation: st-float 3.4s ease-in-out infinite alternate; }
    .st-lively .st-float-2 { animation: st-float 2.9s ease-in-out -1.4s infinite alternate; }
    /* The hero bubble pops in first (story-hero), then floats: the float comes second, so it wins once it starts. */
    .st-lively .st-pop { animation: st-pop .45s cubic-bezier(.3,1.5,.5,1) .75s both, st-float 3.4s ease-in-out 1.3s infinite alternate; }
    .st-lively .st-lift { transition: transform .35s cubic-bezier(.3,1.4,.5,1); }
    .st-lively .st-lift:hover { transform: translateY(-6px) rotate(-.6deg); }
    .st-lively .st-lift:hover .st-lift-pic { animation: st-jelly .7s ease-in-out; }
    .st-lively .st-pennant { transform-box: fill-box; transform-origin: 50% 0; animation: st-pennant 2.4s ease-in-out infinite alternate; }
    .st-lively .st-pennant:nth-child(odd) { animation-delay: -1.2s; animation-duration: 2.9s; }

    /*------ Scroll reveals ------*/
    /* Driven by the scroll itself where the browser can; elsewhere (Firefox for now) things simply show. */
    @supports (animation-timeline: view()) {
      .st-lively .st-reveal { animation: st-reveal linear both; animation-timeline: view(); animation-range: entry 5% entry 75%; }
      .st-lively .st-reveal-pop { animation: st-reveal-pop linear both; animation-timeline: view(); animation-range: entry 10% entry 80%; }
    }
  }

  @keyframes st-sway { from { transform: rotate(-1.6deg); } to { transform: rotate(1.6deg); } }
  /* Still most of the time, then a quick happy shake. */
  @keyframes st-wiggle {
    0%, 82%, 100% { transform: none; }
    85% { transform: rotate(-3deg); } 88% { transform: rotate(2.5deg); }
    91% { transform: rotate(-2deg); } 94% { transform: rotate(1deg); }
  }
  /* The curious head tilt: one way, hold, the other way, back. */
  @keyframes st-tilt {
    0%, 20%, 100% { transform: none; }
    28%, 42% { transform: rotate(-7deg); }
    52%, 64% { transform: rotate(5deg); }
    72% { transform: none; }
  }
  @keyframes st-twitch {
    0%, 70%, 100% { transform: none; }
    74% { transform: translateY(-6%) rotate(-3deg); } 78% { transform: translateY(-2%) rotate(2deg); }
    82% { transform: translateY(-7%) rotate(-1deg); } 88% { transform: none; }
  }
  @keyframes st-swing { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
  /* Two excited hops, then a rest: "let's go?" */
  @keyframes st-hop {
    0%, 46%, 100% { transform: none; }
    8% { transform: translateY(-9%) scale(.98, 1.03); } 16% { transform: scale(1.03, .97); }
    24% { transform: translateY(-7%) scale(.98, 1.03); } 32% { transform: scale(1.02, .98); }
    38% { transform: none; }
  }
  @keyframes st-breathe { 0%, 100% { transform: none; } 50% { transform: scale(1.012, 1.025); } }
  @keyframes st-ticks { 0%, 100% { opacity: 1; transform: none; } 50% { opacity: .35; transform: scale(.85); } }
  @keyframes st-jelly {
    0%, 100% { transform: none; }
    20% { transform: rotate(-4deg) scale(1.04, .96); } 40% { transform: rotate(3deg) scale(.97, 1.04); }
    60% { transform: rotate(-2deg) scale(1.02, .98); } 80% { transform: rotate(1deg); }
  }
  @keyframes st-pet {
    0%, 32%, 100% { transform: none; }
    8% { transform: rotate(-2deg) scale(1.02, .98); } 16% { transform: rotate(1.5deg) scale(.99, 1.02); }
    24% { transform: rotate(-.8deg); }
  }
  @keyframes st-float { from { transform: translateY(0); } to { transform: translateY(-6px); } }
  @keyframes st-pennant { from { transform: rotate(-9deg); } to { transform: rotate(9deg); } }
  @keyframes st-reveal { from { opacity: 0; transform: translateY(2.5rem); } to { opacity: 1; transform: none; } }
  @keyframes st-reveal-pop { from { opacity: 0; transform: translateY(2rem) scale(.9) rotate(-2deg); } to { opacity: 1; transform: none; } }
`;
