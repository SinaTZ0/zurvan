import type { MascotCutName } from "~/components/mascot-cut";

/*===== Types =====*/
/** The steps of the sign-in flow. Each is asked by a dog standing at the door; the stage keeps all four in place. */
export type AuthStepName = "phone" | "password" | "code" | "name";

/**
 * One step's dog. Every class set is written out whole (Tailwind finds literal names only) and measured in the stage's
 * unit, `--u` (see `AuthStage`): a phone band and the desktop panel are each drawn on a grid of units, so a smaller
 * screen scales the whole scene instead of cropping it.
 */
type AuthScene = {
  /** The pose that waits at the door. All four face the form (the picture's right). */
  pose: MascotCutName;
  /** What he says in the bubble: first person, short, no orders and no promises. */
  line: string;
  /** His height. The poses differ in size, so each gets the height that matches the others' heads, never past ~1.3x. */
  size: string;
  /** His idle loop: the shared `lively-*` classes. */
  loop: string;
  /** Where his picture's centre stands along the path (the cut-outs' bodies sit off-centre, so each is nudged). */
  place: string;
  /**
   * The bubble's right edge, from the dog's right edge: `(1 - his head's share of his width)` less how far the tail is
   * from the bubble's right edge. Desktop aims the tail (36px in) at the head's centre; on a phone the bubble must stay
   * left of the logo, so its tail (8px in from the edge here) aims at the forehead.
   */
  bubble: string;
};

/*===== Scenes =====*/
export const AUTH_SCENES: Record<AuthStepName, AuthScene> = {
  // Hello at the door: the paw is up.
  phone: {
    pose: "wave",
    line: "سلام! شمارتو بده تا بشناسمت.",
    size: "h-[calc(10.2*var(--u))] lg:h-[calc(25*var(--u))]",
    loop: "lively-wiggle",
    place: "left-[calc(13.4*var(--u))] lg:left-[calc(28.5*var(--u))]",
    bubble: "right-[calc(50%-8px)] lg:right-[calc(50%-36px)]",
  },
  // He brings the key: the password is the other way in.
  password: {
    pose: "key-carry",
    line: "رمزتو بگو؛ دیگه لازم نیست منتظر پیامک بمونی.",
    size: "h-[calc(11*var(--u))] lg:h-[calc(30.5*var(--u))]",
    loop: "lively-breathe",
    place: "left-[calc(12.5*var(--u))] lg:left-[calc(29*var(--u))]",
    bubble: "right-[calc(39%-8px)] lg:right-[calc(39%-36px)]",
  },
  // The phone is in his paws: the SMS has arrived.
  code: {
    pose: "smartphone",
    line: "پیامک رسید؟ کد پنج‌رقمی رو بگو.",
    size: "h-[calc(10.8*var(--u))] lg:h-[calc(30*var(--u))]",
    loop: "lively-breathe",
    place: "left-[calc(12.1*var(--u))] lg:left-[calc(29.5*var(--u))]",
    bubble: "right-[calc(31%-8px)] lg:right-[calc(31%-36px)]",
  },
  // Head tilted, ears up: he is waiting to hear the name.
  name: {
    pose: "listen",
    line: "حالا اسمتو بگو، می‌خوام صدات کنم.",
    size: "h-[calc(11*var(--u))] lg:h-[calc(30.5*var(--u))]",
    loop: "lively-tilt",
    place: "left-[calc(13.2*var(--u))] lg:left-[calc(28.5*var(--u))]",
    bubble: "right-[calc(46%-8px)] lg:right-[calc(46%-36px)]",
  },
};

/** The steps in the order they come. */
export const AUTH_STEP_NAMES = Object.keys(AUTH_SCENES) as AuthStepName[];
