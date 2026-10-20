/*===== Brick =====*/
// A wall for the mascot to look over: the home hero's card and the catalogue's family shelf. Four courses in running bond (64×22 bricks, 3px of mortar), each
// brick a slightly different wash of ink over the card's grey, so the mortar is just the grey showing between them.
// The tile is three bricks wide; a brick cut by the tile's edge gets the same tone on both sides, so the seam is hidden.
const BRICK_TONES = [0.05, 0.03, 0.065, 0.04, 0.06, 0.028, 0.045, 0.07, 0.035, 0.055, 0.032, 0.062];

function brickWall() {
  const bricks: string[] = [];
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 ? -32 : 0;
    for (let i = 0; i < (offset ? 4 : 3); i++) {
      const opacity = BRICK_TONES[row * 3 + (i % 3)];
      bricks.push(
        `<rect x='${offset + i * 64 + 1.5}' y='${row * 22 + 1.5}' width='61' height='19' rx='1.5' fill-opacity='${opacity}'/>`,
      );
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='192' height='88' fill='#F4EEE2'>${bricks.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The brick wall, an SVG data URL to layer under the paper grain. */
export const BRICK = brickWall();
