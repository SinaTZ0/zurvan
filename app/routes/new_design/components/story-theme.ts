// Every colour is a `--st-*` custom property on the page's root (`.st-root`). `--st-red` is the main action's colour
// (the gold) and `--st-on-red` its text; `--st-dim` is the filter that steps the scenery back, so the dog stays the
// brightest thing on the page.

/*===== Tokens =====*/
// Paper grain is a tiny tiled SVG noise at 7% opacity: cheap, and it keeps the flat paper from looking digital.
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.07'/%3E%3C/svg%3E\")";

// Neutral black and bright yellow gold (the owner's pick, 2026-10-20). Gold goes only on buttons and icons: big gold
// on the first screen reads as a bullion shop. The `--st-sage*` names are the storybook's bands, now greys.
const GOLD = "#FFC21A";
const TOKENS = `
  --st-paper: #141414; --st-paper-2: #1D1D1D; --st-sage: #232323; --st-sage-2: #2B2B2B; --st-sage-deep: ${GOLD};
  --st-ink: #F4EEE2; --st-red: ${GOLD}; --st-red-deep: #FFD14F; --st-on-red: #1A1300; --st-mustard: ${GOLD};
  --st-dim: brightness(.6) saturate(.65);
  --st-line: var(--st-ink); --st-bubble-line: var(--st-ink); --st-bubble-ink: var(--st-ink);`;

export const THEME_CSS = `
  .st-root { ${TOKENS} color-scheme: dark; }
  .st-root .st-dim { filter: var(--st-dim); }
`;

/*===== Lively =====*/
// The idle motion. Every loop is long and small, so the page feels alive without nagging, and
// the whole block is off for reduced motion. The keyframes animate `transform`, which composes with Tailwind's own
// `translate`/`rotate`/`scale` properties instead of replacing them, so a flipped cut-out stays flipped.
export const LIVELY_CSS = `
  @media (prefers-reduced-motion: no-preference) {
    /*------ Scenery ------*/
    .st-root .st-sway { transform-origin: 50% 100%; animation: st-sway 5.5s ease-in-out infinite alternate; }
    .st-root .st-sway-2 { transform-origin: 50% 100%; animation: st-sway 4.2s ease-in-out -2s infinite alternate-reverse; }

    /*------ The dog ------*/
    .st-root .st-wiggle { transform-origin: 50% 100%; animation: st-wiggle 6s ease-in-out infinite; }
    .st-root .st-wiggle-late { transform-origin: 50% 100%; animation: st-wiggle 7s ease-in-out -3.5s infinite; }
    .st-root .st-tilt { transform-origin: 50% 90%; animation: st-tilt 5s ease-in-out infinite; }
    .st-root .st-twitch { transform-origin: 50% 100%; animation: st-twitch 4s ease-in-out infinite; }
    .st-root .st-swing { transform-origin: 50% 0; animation: st-swing 3.2s ease-in-out infinite alternate; }
    .st-root .st-hop { transform-origin: 50% 100%; animation: st-hop 2.8s cubic-bezier(.3,.7,.4,1) infinite; }
    .st-root .st-breathe { transform-origin: 50% 100%; animation: st-breathe 2.6s ease-in-out infinite; }
    .st-root .st-ticks { animation: st-ticks 1.4s ease-in-out infinite; }
    /* Petting: hovering a dog makes him wriggle, whatever his idle loop is. One soft wriggle, then a rest, so a
       resting cursor doesn't keep him shaking. */
    .st-root .st-pet { pointer-events: auto; }
    .st-root .st-pet:hover { transform-origin: 50% 100%; animation: st-pet 2.6s ease-in-out infinite; }

    /*------ Bubbles and cards ------*/
    .st-root .st-float { animation: st-float 3.4s ease-in-out infinite alternate; }
    .st-root .st-float-2 { animation: st-float 2.9s ease-in-out -1.4s infinite alternate; }
    /* The hero bubble pops in first (story-hero), then floats: the float comes second, so it wins once it starts. */
    .st-root .st-pop { animation: st-pop .45s cubic-bezier(.3,1.5,.5,1) .75s both, st-float 3.4s ease-in-out 1.3s infinite alternate; }
    .st-root .st-lift { transition: transform .35s cubic-bezier(.3,1.4,.5,1); }
    .st-root .st-lift:hover { transform: translateY(-6px) rotate(-.6deg); }
    .st-root .st-lift:hover .st-lift-pic { animation: st-jelly .7s ease-in-out; }
    .st-root .st-pennant { transform-box: fill-box; transform-origin: 50% 0; animation: st-pennant 2.4s ease-in-out infinite alternate; }
    .st-root .st-pennant:nth-child(odd) { animation-delay: -1.2s; animation-duration: 2.9s; }

    /*------ Scroll reveals ------*/
    /* Driven by the scroll itself where the browser can; elsewhere (Firefox for now) things simply show. */
    @supports (animation-timeline: view()) {
      .st-root .st-reveal { animation: st-reveal linear both; animation-timeline: view(); animation-range: entry 5% entry 75%; }
      .st-root .st-reveal-pop { animation: st-reveal-pop linear both; animation-timeline: view(); animation-range: entry 10% entry 80%; }
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
