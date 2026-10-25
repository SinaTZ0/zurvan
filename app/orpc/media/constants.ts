import type { UserRole } from "~/lib/user-constants";

/*===== Media Constants =====*/
// Browser-safe values shared by the upload API, the image component and the forms. See docs/media.md.

/*===== Kinds =====*/
export const MEDIA_KINDS = ["avatar", "dog", "course", "certificate", "evaluation", "record", "post", "figure"] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

/*===== Variants =====*/
/**
 * - `cover` crops to exactly `width` × `height`, keeping the most interesting part of the image.
 * - `inside` fits the image in the box, keeping its aspect ratio. It never upscales or stretches.
 */
export type MediaVariantSpec = { mode: "cover" | "inside"; width: number; height: number };

/**
 * The fixed set of variants per kind, generated once at upload. Sizes are about twice the largest CSS size each one is
 * shown at, so they stay sharp on high-density screens.
 */
export const MEDIA_VARIANTS = {
  avatar: {
    thumb: { mode: "cover", width: 96, height: 96 },
    md: { mode: "cover", width: 320, height: 320 },
  },
  dog: {
    thumb: { mode: "cover", width: 160, height: 160 },
    card: { mode: "cover", width: 800, height: 600 },
    full: { mode: "inside", width: 1600, height: 1600 },
  },
  course: {
    thumb: { mode: "cover", width: 480, height: 270 },
    card: { mode: "cover", width: 960, height: 540 },
    hero: { mode: "cover", width: 1920, height: 823 },
  },
  certificate: {
    thumb: { mode: "cover", width: 320, height: 240 },
    full: { mode: "inside", width: 2000, height: 2000 },
  },
  // A photo the customer sends with an evaluation request (F3).
  evaluation: {
    thumb: { mode: "cover", width: 320, height: 240 },
    full: { mode: "inside", width: 1600, height: 1600 },
  },
  // A photo in a dog's file: its vaccination card, a medical document or its tattoo (F2). Papers need the larger full
  // size to stay readable. Kinds are lowercase letters only: nginx's media route matches `[a-z]+` (docs/media.md).
  record: {
    thumb: { mode: "cover", width: 320, height: 240 },
    full: { mode: "inside", width: 2000, height: 2000 },
  },
  // A blog post's cover (F16): the cards and the article's header like a course's, plus `og` at the size link
  // previews ask for (`og:image`).
  post: {
    thumb: { mode: "cover", width: 480, height: 270 },
    card: { mode: "cover", width: 960, height: 540 },
    hero: { mode: "cover", width: 1920, height: 823 },
    og: { mode: "cover", width: 1200, height: 630 },
  },
  // An image inside a post's text: `inline` fills the article's reading column (about 720px), `full` opens it.
  figure: {
    inline: { mode: "inside", width: 1440, height: 1440 },
    full: { mode: "inside", width: 2000, height: 2000 },
  },
} as const satisfies Record<MediaKind, Record<string, MediaVariantSpec>>;

export type MediaVariantName<Kind extends MediaKind> = keyof (typeof MEDIA_VARIANTS)[Kind] & string;

/** Looks a variant up by name; undefined when the kind has no such variant. */
export function getMediaVariantSpec({
  kind,
  variant,
}: {
  kind: MediaKind;
  variant: string;
}): MediaVariantSpec | undefined {
  const variants: Record<string, MediaVariantSpec> = MEDIA_VARIANTS[kind];
  return variants[variant];
}

/**
 * The pixel size a variant is stored at. `cover` is always its box; `inside` shrinks the original's aspect ratio into
 * the box and never enlarges it (the same rule the processing applies, so `<img>` gets its intrinsic size right).
 */
export function getMediaVariantSize({
  spec,
  mediaWidth,
  mediaHeight,
}: {
  spec: MediaVariantSpec;
  mediaWidth: number;
  mediaHeight: number;
}): { width: number; height: number } {
  if (spec.mode === "cover") return { width: spec.width, height: spec.height };

  const scale = Math.min(spec.width / mediaWidth, spec.height / mediaHeight, 1);
  return { width: Math.max(1, Math.round(mediaWidth * scale)), height: Math.max(1, Math.round(mediaHeight * scale)) };
}

/*===== Upload Limits =====*/
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;

/** For the file input's `accept`. The server checks the real format, never this. */
export const MEDIA_ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

/*===== Who Uploads What =====*/
/** The kinds each role may upload: only the ones its pages use (customers have no course covers, for example). */
export const MEDIA_UPLOAD_KINDS_BY_ROLE: Record<UserRole, readonly MediaKind[]> = {
  customer: ["avatar", "dog", "evaluation", "record"],
  partner: ["avatar"],
  admin: MEDIA_KINDS,
};
