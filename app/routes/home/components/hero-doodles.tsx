import { cn } from "cn";
import { Children, cloneElement, isValidElement, useId } from "react";

/*===== Figures =====*/
// Each figure is drawn facing left, the way the procession walks (forward, in RTL), with its feet on y = 0 and its
// body above it at negative y. Each is a fragment of strokes; `withPathLength` prepares them for the draw-in.
const FIGURES = {
  dogWalk: (
    <>
      <circle cx="4" cy="-18" r="3.6" />
      <path d="M5.5 -21 q3 1 2.2 5" />
      <path d="M0.6 -17.5 l-3 0.8" />
      <path d="M8 -13 C14 -15 24 -15 30 -13 C32 -11 31.5 -7.5 29 -7 C22 -6.2 15 -6.2 10 -7 C7.5 -8 7 -11 8 -13 Z" />
      <path d="M10.5 -7 L8 0 M13 -7 L14.5 0 M26.5 -7 L24.5 0 M29 -7.5 L32 0" />
      <path d="M30.5 -13 Q35 -17 33.5 -22" />
    </>
  ),
  dogRun: (
    <>
      <circle cx="3" cy="-21" r="3.6" />
      <path d="M4.5 -24 q3.5 0 3.5 4.5" />
      <path d="M7 -16.5 C13 -18 24 -17 30 -14 C32 -12 31 -9.5 28.5 -9.5 C22 -10 15 -10.5 9.5 -11 C7 -12 6 -14.5 7 -16.5 Z" />
      <path d="M9.5 -11.5 L1 -7 M12 -11 L4 -4 M27 -10 L33 -3 M29 -10.5 L37 -6" />
      <path d="M30 -14 Q36 -15 39 -19" />
    </>
  ),
  dogLeap: (
    <>
      <circle cx="2" cy="-30" r="3.6" />
      <path d="M3.5 -33 q3 0.5 2.5 4.5" />
      <path d="M6 -27 C12 -26 22 -21 27 -17 C28 -15 27 -13 25 -13.5 C19 -16 11 -20 5.5 -23 C4 -24.5 4.5 -26.5 6 -27 Z" />
      <path d="M6 -23 L-3 -21 M8 -22 L-1 -17.5 M25 -14 L33 -9.5 M27 -15 L35.5 -13.5" />
      <path d="M27 -17 Q32 -20 34 -25" />
    </>
  ),
  dogSit: (
    <>
      <circle cx="4" cy="-24" r="3.6" />
      <path d="M5.5 -27 q3 1 2.2 5" />
      <path d="M0.6 -23.5 l-3 0.8" />
      <path d="M5.5 -20.5 C9 -19 15 -12 16 -3 C16 -0.5 13 0 11 0 L6 0 C5 -7 4.5 -14 5.5 -20.5 Z" />
      <path d="M7.5 -11 L5.5 0" />
      <path d="M15.5 -1 Q22 0 23 -4" />
    </>
  ),
  catSit: (
    <>
      <circle cx="6" cy="-21" r="4.2" />
      <path d="M3 -24 L2.5 -29.5 L6 -25.4 M7.5 -25.4 L10.5 -29 L10.2 -23.5" />
      <path d="M3 0 C-1 -8 2 -16 6.5 -17 C12 -16 15 -8 11 0 Z" />
      <path d="M11 -1 Q20 0 18 -8 Q17 -12 20 -14" />
    </>
  ),
  catWalk: (
    <>
      <circle cx="4" cy="-17" r="3.6" />
      <path d="M1.5 -19.5 L1 -24 L4 -20.8 M5.5 -20.8 L8 -24 L7.8 -19.5" />
      <path d="M7.5 -14 C13 -15.5 21 -15.5 26 -14 C27.5 -12 27 -9 24.5 -8.5 C19 -8 13 -8 9.5 -8.5 C7 -9.5 6.5 -12 7.5 -14 Z" />
      <path d="M10 -8.5 L8 0 M12.5 -8.5 L13.5 0 M22.5 -8.5 L21 0 M25 -9 L27.5 0" />
      <path d="M26 -14 Q31 -14 31 -20 Q31 -25 35 -26" />
    </>
  ),
  person: (
    <>
      <circle cx="6" cy="-32" r="3.6" />
      <path d="M6.5 -28 L8 -15" />
      <path d="M8 -15 L3 0 M8 -15 L13 0" />
      <path d="M7 -25 L1 -19 M7 -25 L12 -18" />
    </>
  ),
  trainer: (
    <>
      <circle cx="6" cy="-32" r="3.6" />
      <path d="M6.5 -28 L8 -15" />
      <path d="M8 -15 L4 0 M8 -15 L11.5 0" />
      <path d="M7 -25 L-1 -31 M7 -25 L11 -17" />
      {/* A whistle on a cord */}
      <path d="M6.6 -27.5 Q4 -24 6.8 -21.5 L4.6 -20.8" />
    </>
  ),
  hurdle: (
    <>
      <path d="M0 0 L0 -22 M30 0 L30 -22" />
      <path d="M-3 0 L3 0 M27 0 L33 0" />
      <path d="M-1 -14 L31 -14" />
      <path d="M8 -16 L10 -12 M16 -16 L18 -12 M24 -16 L26 -12" />
    </>
  ),
  // The cat tree stands in for the reference art's lattice tower.
  catTree: (
    <>
      <path d="M2 0 L5 -44 M24 0 L21 -44" />
      <path d="M3 -14 L23 -14 M4 -28 L22 -28 M-1 -44 L27 -44" />
      <path d="M2 0 L23 -14 M24 0 L3 -14 M3.5 -14 L22 -28 M22.5 -14 L4 -28 M4 -28 L21 -44 M22 -28 L5 -44" />
      <path d="M4 -44 C4 -50 14 -51 19 -46 C20 -45 19.5 -44 18 -44" />
      <circle cx="4.5" cy="-48.5" r="3.4" />
      <path d="M2.2 -51 L1.6 -55 L4.6 -51.9 M5.8 -51.9 L8.4 -54.5 L7.8 -50.6" />
      <path d="M19 -44 Q22.5 -40 20 -35" />
    </>
  ),
  ball: (
    <>
      <circle cx="0" cy="-4" r="4" />
      <path d="M-3.2 -6.4 Q0 -3.4 3.2 -6.4" />
      <path d="M6 -10 Q9 -18 13 -20 M16 -20 Q19 -18 21 -14" />
    </>
  ),
  bone: (
    <>
      <path d="M3 -4.4 L13 -4.4 M3 -1.6 L13 -1.6 M3 -4.4 a1.6 1.6 0 1 0 -1.2 1.4 a1.6 1.6 0 1 0 1.2 1.4 M13 -4.4 a1.6 1.6 0 1 1 1.2 1.4 a1.6 1.6 0 1 1 -1.2 1.4" />
    </>
  ),
  paws: (
    <>
      <path d="M0 -2 h1.6 M6 -6 h1.6 M12 -2 h1.6 M18 -6 h1.6 M24 -2 h1.6 M30 -6 h1.6" />
    </>
  ),
  // The sky figures are drawn around their own centre rather than standing on a ground line.
  bird: (
    <>
      <path d="M-6 0 Q-3 -4 0 -0.5 Q3 -4 6 0" />
    </>
  ),
  kite: (
    <>
      <path d="M0 -10 L6.5 0 L0 10 L-6.5 0 Z" />
      <path d="M0 -10 L0 10 M-6.5 0 L6.5 0" />
      <path d="M0 10 q-3.5 4 0 8 q3.5 4 0 8 M-2 14 l4 1 M-2 22 l4 1" />
    </>
  ),
} as const;

type Figure = keyof typeof FIGURES;

/*===== Scenes =====*/
/** One figure in a scene, at its feet (or centre, for sky figures). `flip` turns it to face right. */
type Placement = { figure: Figure; x: number; y: number; scale?: number; flip?: boolean };

/** Figures that belong together, plus the leashes and strings that tie them. A floating scene moves each as one. */
type Group = { placements: Placement[]; strings?: string[] };

/** A drawing in viewBox units. */
type Scene = { width: number; height: number; groups: Group[] };

/**
 * Stands figures on one ground line; `lift` raises one off it, like a dog mid-jump. The side scenes stack several
 * rows, like the rows of riders in the reference art.
 */
function row(ground: number, figures: (Omit<Placement, "y"> & { lift?: number })[]): Placement[] {
  return figures.map(({ lift = 0, ...figure }) => ({ ...figure, y: ground - lift }));
}

/*------ Frieze ------*/
/** The frieze's ground line, in viewBox units. */
const GROUND = 62;

// Read left to right: the front of the procession (a dog clearing a hurdle under the trainer's eye) sits at the
// left edge, which is always on screen. Narrower screens crop from the right, so the later walkers drop off first.
const FRIEZE: Scene = {
  width: 920,
  height: 64,
  groups: [
    {
      placements: row(GROUND, [
        { figure: "ball", x: 6 },
        { figure: "hurdle", x: 44 },
        { figure: "dogLeap", x: 46, lift: 10 },
        { figure: "trainer", x: 98 },
        { figure: "dogSit", x: 124, scale: 0.9 },
        { figure: "dogSit", x: 152, scale: 0.75 },
        { figure: "dogWalk", x: 186 },
        { figure: "person", x: 226 },
        { figure: "catSit", x: 258 },
        { figure: "catTree", x: 292 },
        { figure: "dogRun", x: 334, scale: 0.85 },
        { figure: "dogWalk", x: 380, scale: 1.1 },
        { figure: "person", x: 424 },
        { figure: "catWalk", x: 452, scale: 0.9 },
        { figure: "person", x: 488 },
        { figure: "bone", x: 516 },
        { figure: "dogWalk", x: 540, scale: 0.7 },
        { figure: "dogWalk", x: 572 },
        { figure: "person", x: 612 },
        { figure: "paws", x: 646 },
        { figure: "dogRun", x: 690 },
        { figure: "dogSit", x: 740, scale: 0.8 },
        { figure: "person", x: 764 },
        { figure: "catSit", x: 796, scale: 0.85 },
        { figure: "dogWalk", x: 826, scale: 0.85 },
        { figure: "person", x: 862 },
        { figure: "paws", x: 894 },
      ]),
      strings: [
        leash({ ground: GROUND, hand: 226, collar: 193 }),
        leash({ ground: GROUND, hand: 424, collar: 388, collarY: 15.4 }),
        leash({ ground: GROUND, hand: 612, collar: 579 }),
        leash({ ground: GROUND, hand: 862, collar: 832, collarY: 12 }),
      ],
    },
  ],
};

/*------ Side scenes ------*/
// Sparse scenes for the empty margins beside the page on wide screens: a few moments with plenty of air between
// them, so the margins frame the page without competing with it. Each keeps its figures next to the content, because
// a narrower margin crops it from the screen edge inward. Their rows sit well below the top of the hero, beside the
// photo rather than the headline.

/** Beside the left edge of the page: a jump, and a walk. */
const LEFT_SCENE: Scene = {
  width: 200,
  height: 720,
  groups: [
    {
      placements: row(390, [
        { figure: "hurdle", x: 110 },
        { figure: "dogLeap", x: 112, lift: 10 },
      ]),
    },
    {
      placements: row(650, [
        { figure: "dogWalk", x: 110 },
        { figure: "person", x: 150 },
      ]),
      strings: [leash({ ground: 650, hand: 150, collar: 117 })],
    },
  ],
};

/** Beside the right edge of the page: a game of fetch, and a cat and dog sitting. */
const RIGHT_SCENE: Scene = {
  width: 200,
  height: 720,
  groups: [
    {
      placements: row(330, [
        { figure: "ball", x: 6 },
        { figure: "dogRun", x: 32 },
      ]),
    },
    {
      placements: row(560, [
        { figure: "catSit", x: 16 },
        { figure: "dogSit", x: 46 },
      ]),
    },
  ],
};

/*------ Review companions ------*/
// One small scene per review card, in the order the cards appear. The hero places each one where its card has room:
// perched on the top edge, beside it, or under it.
const REVIEW_SCENES: Scene[] = [
  {
    width: 44,
    height: 34,
    groups: [{ placements: [...row(33, [{ figure: "catSit", x: 6 }]), { figure: "bird", x: 36, y: 8 }] }],
  },
  {
    width: 50,
    height: 30,
    groups: [
      {
        placements: row(29, [
          { figure: "dogSit", x: 4 },
          { figure: "ball", x: 30 },
        ]),
      },
    ],
  },
  {
    width: 40,
    height: 20,
    groups: [
      {
        placements: [
          { figure: "bird", x: 8, y: 12 },
          { figure: "bird", x: 24, y: 6, scale: 0.8 },
          { figure: "bird", x: 33, y: 16, scale: 0.6 },
        ],
      },
    ],
  },
  { width: 42, height: 28, groups: [{ placements: row(27, [{ figure: "catWalk", x: 4 }]) }] },
  { width: 44, height: 36, groups: [{ placements: row(35, [{ figure: "dogLeap", x: 6 }]) }] },
];

/*===== Hero Doodles =====*/
/**
 * A saffron scribble frieze for the hero's empty space: a training class walking in single file, after the
 * figure-and-tower doodles of old Persian scroll art. Purely decorative, so it is hidden from assistive tech.
 *
 * The procession marches endlessly from left to right, facing the way it walks. It is a track of three identical
 * copies sliding one copy's width, so the loop has no seam; the parent clips and fades it, and must be no wider than
 * two copies. Size the track by height (`className` goes on it); each copy keeps its aspect ratio. Reduced motion
 * leaves it standing still.
 */
export function HeroDoodles({ className }: { className?: string }) {
  return (
    // Laid out left to right whatever the page direction, so the copies and the slide agree on which way is forward.
    <div dir="ltr" className={cn("flex w-max animate-doodle-march motion-reduce:animate-none", className)}>
      {[0, 1, 2].map((copy) => (
        <DoodleScene key={copy} scene={FRIEZE} className="h-full w-auto shrink-0 -scale-x-100" />
      ))}
    </div>
  );
}

/**
 * The tall scene for one of the empty margins beside the page. Its figures rise one by one from the bottom of the
 * screen, the two sides taking turns, and then each group floats on its own slow beat. Size it by width; it keeps its
 * aspect ratio.
 */
export function HeroSideDoodles({ side, className }: { side: "left" | "right"; className?: string }) {
  return (
    <DoodleScene
      scene={side === "left" ? LEFT_SCENE : RIGHT_SCENE}
      // The right side starts half a step after the left, so the figures arrive alternately, ~350ms apart.
      delay={side === "left" ? 400 : 750}
      stagger={700}
      rise
      float
      className={className}
    />
  );
}

/**
 * The small scene that comes with one review card. Mount it when the card appears: it draws itself in on mount.
 * It is drawn larger than the margin doodles, with `onPhoto` contrast, so it holds up over the busy grass.
 */
export function HeroReviewDoodle({ index, className }: { index: number; className?: string }) {
  return (
    <DoodleScene
      scene={REVIEW_SCENES[index % REVIEW_SCENES.length]}
      delay={250}
      stagger={150}
      onPhoto
      // Smaller on phones, where it fits in the gap beside its card.
      className={cn("w-[calc(var(--scene-width)*1.25px)] lg:w-[calc(var(--scene-width)*2.2px)]", className)}
    />
  );
}

/*===== Doodle Scene =====*/
/**
 * Draws a scene in saffron with wobbly, hand-drawn strokes. Figures draw in one after another, `stagger` ms apart
 * from `delay`; each group's strings follow once its figures are partly down. With `rise`, figures instead come up from
 * below the scene one after another, and strings fade in once the group's last figure has arrived. With `float`, each
 * group bobs and tilts gently, out of step with the others. Reduced motion turns all of it off.
 *
 * Sized by CSS; `--scene-width` holds the viewBox width, to size it in pixels per unit. `onPhoto` adds the night-time glow
 * in both themes, over a soft dark shadow that lifts the lines off bright parts of the photo.
 */
function DoodleScene({
  scene,
  delay = 0,
  stagger = 70,
  rise = false,
  float = false,
  onPhoto = false,
  className,
}: {
  scene: Scene;
  delay?: number;
  stagger?: number;
  rise?: boolean;
  float?: boolean;
  onPhoto?: boolean;
  className?: string;
}) {
  // Each scene has its own filter, sized to it, so the ids must not collide when a scene appears twice.
  const filterId = `${useId()}-wobble`;
  // Draw-in order runs across groups, so each group starts where the previous one's figures left off.
  const firstIndex = scene.groups.map((_, index) =>
    scene.groups.slice(0, index).reduce((count, group) => count + group.placements.length, 0),
  );

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "max-w-none overflow-visible text-saffron dark:drop-shadow-[0_0_4px_color-mix(in_oklab,var(--saffron)_55%,transparent)]",
        onPhoto && "drop-shadow-[0_0_4px_color-mix(in_oklab,var(--saffron)_55%,transparent),0_1px_3px_rgb(0_0_0/0.55)]",
        className,
      )}
      style={{ "--scene-width": scene.width } as React.CSSProperties}
    >
      <defs>
        {/* Bends every clean stroke a little, so the lines read as a pen drawn by hand rather than geometry. The
            region is in user units, so the wobble reaches the figures at the scene's very edges. */}
        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          x={-8}
          y={-8}
          width={scene.width + 16}
          height={scene.height + 16}
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="11" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* The filter stays put while floating groups move through it, so their lines shift a little as they bob. */}
      <g filter={`url(#${filterId})`}>
        {scene.groups.map((group, groupIndex) => (
          <g
            key={groupIndex}
            // A different length and a negative delay per group, so they never bob in unison.
            style={
              float
                ? { animationDuration: `${5 + groupIndex * 1.3}s`, animationDelay: `${-groupIndex * 2.1}s` }
                : undefined
            }
            className={cn(
              float && "origin-center animate-doodle-float [transform-box:fill-box] motion-reduce:animate-none",
            )}
          >
            {/*------ Figures ------*/}
            {group.placements.map(({ figure, x, y, scale = 1, flip }, index) => {
              const strokes = (
                <g
                  transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
                  // Thinner strokes on scaled-down figures would look fainter, so the width is held constant.
                  strokeWidth={1.6 / scale}
                  style={
                    rise ? undefined : { animationDelay: `${delay + (firstIndex[groupIndex] + index) * stagger}ms` }
                  }
                  className={cn(!rise && "animate-doodle-draw [stroke-dasharray:1] motion-reduce:animate-none")}
                >
                  {withPathLength(FIGURES[figure])}
                </g>
              );

              // The placement already uses the `transform` attribute, which a CSS animation would override, so the
              // rise goes on a wrapper.
              return rise ? (
                <g
                  key={`${figure}-${x}-${y}`}
                  style={{ animationDelay: `${delay + (firstIndex[groupIndex] + index) * stagger}ms` }}
                  className="animate-doodle-rise motion-reduce:animate-none"
                >
                  {strokes}
                </g>
              ) : (
                <g key={`${figure}-${x}-${y}`}>{strokes}</g>
              );
            })}

            {/*------ Leashes and strings ------*/}
            {group.strings?.map((d, index) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                style={{
                  animationDelay: rise
                    ? // A rising figure is not at its leash's end until it lands, so the line waits for the last one.
                      `${delay + (firstIndex[groupIndex] + group.placements.length) * stagger}ms`
                    : `${delay + (firstIndex[groupIndex] + group.placements.length * 0.4) * stagger + index * 200}ms`,
                }}
                className={
                  rise
                    ? "animate-doodle-fade motion-reduce:animate-none"
                    : "animate-doodle-draw [stroke-dasharray:1] motion-reduce:animate-none"
                }
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

/*===== Helpers =====*/
/**
 * A leash from a walker's front hand (x) to a dog's collar (x, and height above the ground). It bows up over the
 * dog's back; a sagging one would cross the body and read as a tail.
 */
function leash({
  ground,
  hand,
  collar,
  collarY = 14,
}: {
  ground: number;
  hand: number;
  collar: number;
  collarY?: number;
}) {
  const handX = hand + 1;
  return `M${handX} ${ground - 19} Q${(handX + collar) / 2} ${ground - 24} ${collar} ${ground - collarY}`;
}

/** Gives each stroke of a figure `pathLength="1"`, so one 0 → 1 dash draws it in exactly, whatever its real length. */
function withPathLength(figure: React.ReactElement<{ children: React.ReactNode }>) {
  return Children.map(figure.props.children, (stroke) =>
    isValidElement<{ pathLength?: number }>(stroke) ? cloneElement(stroke, { pathLength: 1 }) : stroke,
  );
}
