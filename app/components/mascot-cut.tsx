import { cn } from "cn";

/*===== Mascot Cut-outs =====*/
// The one registry of the mascot's transparent cut-outs (and the scenery drawn with him), with their natural sizes.
// The files stay in `public/photo/new-design/`, where the home page's design lab put them: renaming them is churn.
// Every image is decorative (the bubbles carry the words), so the alt is empty. The files are low resolution: render a
// cut-out at most about 1.3x its natural width.
export const MASCOT_CUTS = {
  paws: { width: 285, height: 463 },
  // The hero's bark (home): `paws` with only the head redrawn, on the same canvas, so a swap moves nothing else.
  "bark-open": { width: 285, height: 463 },
  "bark-closed": { width: 285, height: 463 },
  peek: { width: 271, height: 275 },
  sit: { width: 317, height: 473 },
  leash: { width: 249, height: 456 },
  upside: { width: 232, height: 344 },
  ears: { width: 271, height: 209 },
  plants: { width: 354, height: 379 },
  hedge: { width: 475, height: 176 },
  ground: { width: 492, height: 93 },
  home: { width: 474, height: 275 },
  center: { width: 491, height: 280 },
  lodge: { width: 480, height: 271 },
  // The home page's «چی می‌تونم یاد بگیرم؟», one pose per service.
  "teach-basic": { width: 308, height: 392 },
  "teach-calm": { width: 402, height: 216 },
  "teach-work": { width: 340, height: 401 },
  "teach-medal": { width: 362, height: 393 },
  "teach-advice": { width: 433, height: 397 },
  // One pose per course family (`~/lib/course-mascot`), cut from image-reference/generated/courses/courses-8.png.
  "course-home": { width: 385, height: 349 },
  "course-manners": { width: 336, height: 440 },
  "course-young": { width: 356, height: 369 },
  "course-basics": { width: 273, height: 447 },
  "course-recall": { width: 289, height: 426 },
  "course-companion": { width: 329, height: 419 },
  "course-working": { width: 344, height: 432 },
  "course-sport": { width: 410, height: 395 },
  // Props along the home page's steps trail.
  signpost: { width: 360, height: 325 },
  key: { width: 360, height: 250 },
  flag: { width: 360, height: 313 },
  bone: { width: 360, height: 174 },
  // Poses for the About, Contact and Help pages (and later ones), cut from image-reference/generated/batch1/poses-8.png.
  // They are smaller than the course poses: keep them under about 1.3x their width here.
  phone: { width: 256, height: 294 },
  think: { width: 196, height: 297 },
  wave: { width: 223, height: 307 },
  diploma: { width: 210, height: 300 },
  basket: { width: 292, height: 267 },
  celebrate: { width: 241, height: 281 },
  letter: { width: 183, height: 292 },
  sleep: { width: 259, height: 172 },
  // Scenery from image-reference/generated/batch1/scenery-4.png: the Tehran skyline (Milad tower, the Alborz), a
  // mailbox, a notice board with blank papers, a park bench with a street lamp.
  tehran: { width: 768, height: 294 },
  mailbox: { width: 320, height: 405 },
  board: { width: 628, height: 399 },
  bench: { width: 634, height: 444 },
  // Poses for the Auth, Privacy and Partner Enquiry pages, cut from image-reference/generated/batch2/poses-8.png: the
  // key in his mouth, a smartphone in his paws, listening, on guard, lying watchful, a shopping bag, groomed with a bow
  // tie, a paw out showing the way.
  "key-carry": { width: 356, height: 439 },
  smartphone: { width: 282, height: 426 },
  listen: { width: 255, height: 443 },
  guard: { width: 269, height: 458 },
  watch: { width: 370, height: 216 },
  shopping: { width: 423, height: 403 },
  groomed: { width: 285, height: 436 },
  present: { width: 354, height: 428 },
  // Scenery from image-reference/generated/batch2/scenery-6.png: a pet shop front, a small vet clinic, a front door in
  // a stretch of brick wall, a chest with a padlock, a drawer cabinet with folders, a shop counter with a card stand.
  petshop: { width: 419, height: 320 },
  clinic: { width: 393, height: 327 },
  door: { width: 395, height: 319 },
  chest: { width: 421, height: 241 },
  cabinet: { width: 319, height: 293 },
  counter: { width: 434, height: 292 },
  // Poses for the Dog Record, Certificate Check, Rules and Not Found pages, cut from
  // image-reference/generated/batch3/poses-8.png: nose down on a scent, a paw on his collar's tag, hugging a closed
  // folder, lying reading a book, ears back and sorry, a magnifying glass in his mouth, a paw pointing up, digging.
  sniff: { width: 287, height: 186 },
  tag: { width: 180, height: 286 },
  folder: { width: 194, height: 288 },
  read: { width: 289, height: 200 },
  sorry: { width: 221, height: 283 },
  magnify: { width: 209, height: 316 },
  "point-up": { width: 221, height: 321 },
  dig: { width: 273, height: 283 },
  // Scenery from image-reference/generated/batch3/scenery-6.png: a gold rosette on a tuft of grass, a framed blank
  // certificate on an easel, a padlocked garden gate in a hedge, an open book on a lectern, a dug hole with a bone, a
  // dog house with a blank name plate. `seal-disc` is the rosette alone, cut round, to stamp on a card.
  seal: { width: 456, height: 464 },
  "seal-disc": { width: 326, height: 326 },
  easel: { width: 439, height: 472 },
  gate: { width: 536, height: 404 },
  lectern: { width: 461, height: 450 },
  hole: { width: 513, height: 279 },
  kennel: { width: 501, height: 423 },
  // Poses for the account pages (the shell, the Dashboard and Dog Detail), cut from
  // image-reference/generated/batch4/poses-8.png: holding up an empty picture frame, lying by an old phone waiting for
  // it to ring, three gold medals round his neck, writing in a notebook with a pencil in his mouth, a play bow, a
  // clipboard of ticked lines with a pencil behind his ear, sitting turned away looking back, lying with a paw on a cup.
  frame: { width: 281, height: 375 },
  "wait-phone": { width: 436, height: 213 },
  medals: { width: 255, height: 389 },
  write: { width: 375, height: 286 },
  bow: { width: 384, height: 343 },
  clipboard: { width: 271, height: 394 },
  "look-back": { width: 215, height: 403 },
  trophy: { width: 474, height: 282 },
  // Scenery from image-reference/generated/batch4/scenery-6.png: a shelf of medals, rosettes and a cup, a cork board of
  // blank pinned instant photos, a round dog bed with a rope toy, two bowls on a mat, an open chest of toys, a plain
  // three-step podium.
  "trophy-shelf": { width: 492, height: 443 },
  "photo-board": { width: 455, height: 433 },
  "dog-bed": { width: 513, height: 338 },
  bowls: { width: 498, height: 272 },
  "toy-box": { width: 484, height: 422 },
  podium: { width: 516, height: 295 },
} as const;

export type MascotCutName = keyof typeof MASCOT_CUTS;

// The scenery steps back so the dog stays the brightest thing on the page (`scenery-dim`, app.css). The dog cut-outs
// are never dimmed; the key and the flag stay bright too, as the steps' two gold accents (the unlock and the finish),
// and so do the seal and its disc (a certificate's gold mark).
const DIMMED = new Set<MascotCutName>([
  "plants",
  "ground",
  "home",
  "center",
  "lodge",
  "signpost",
  "bone",
  "tehran",
  "mailbox",
  "board",
  "bench",
  "petshop",
  "clinic",
  "door",
  "chest",
  "cabinet",
  "counter",
  "easel",
  "gate",
  "lectern",
  "hole",
  "kennel",
  "trophy-shelf",
  "photo-board",
  "dog-bed",
  "bowls",
  "toy-box",
  "podium",
]);

/**
 * One mascot or scenery cut-out. Position and size come from `className`; the aspect ratio is kept by `h-auto`.
 * `eager` is for the first screen's picture (it loads at high priority instead of lazily).
 */
export function MascotCut({
  name,
  className,
  eager = false,
}: {
  name: MascotCutName;
  className?: string;
  eager?: boolean;
}) {
  const { width, height } = MASCOT_CUTS[name];
  return (
    <img
      src={`/photo/new-design/${name}.webp`}
      alt=""
      width={width}
      height={height}
      loading={eager ? undefined : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      draggable={false}
      className={cn("pointer-events-none h-auto max-w-none select-none", DIMMED.has(name) && "scenery-dim", className)}
    />
  );
}
