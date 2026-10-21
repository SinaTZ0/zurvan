import type { MascotCutName } from "~/components/mascot-cut";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Guide Moods =====*/
// The center's dog takes the request to the head trainer. He walks beside the form and his pose follows how far it has
// got; when it is sent he lies down by the phone to wait for the call. Each mood is one pose and one line, in his first
// person, informal spoken Persian (app-spec F3; the brief, Batch 5 §2).

const TRAINER = HEAD_TRAINER.firstName;

export type GuideMood =
  /** Nothing picked yet. */
  | "pick"
  /** A dog picked, days or times missing. */
  | "when"
  /** Days and times picked, no files. */
  | "ready"
  /** A photo or video added. */
  | "photos"
  | "sending"
  /** A failed submit with errors on the fields (the client's or the server's). */
  | "failed"
  /** The server refused the request as a whole (the alert above the button says why). */
  | "serverFailed"
  | "sent"
  /** The account has no dog yet. */
  | "noDogs"
  /** Every dog is waiting for the call or was evaluated. */
  | "nothing";

/**
 * Where a pose stands and where his head is, so the bubble's tail lands on it. `width` is the cut-out's width in rem on
 * the desktop stage (kept under about 1.3x its natural width), `phone` on the phone band; `head` is how far across the
 * picture his head is, from its left edge (every pose faces right).
 */
export type Pose = {
  name: MascotCutName;
  width: number;
  phone: number;
  head: number;
  /**
   * The dimmed piece of scenery beside him that means something for this mood: behind him (his left, which leaves the
   * room over his head for the bubble) or in front of him (his right, what he is nosing at).
   */
  scenery?: { name: MascotCutName; width: number; phone: number; side: "back" | "front" };
};

const POSES = {
  wave: { name: "wave", width: 11, phone: 5.6, head: 0.5 },
  calendar: {
    name: "calendar",
    width: 14,
    phone: 7,
    head: 0.55,
    scenery: { name: "clock", width: 7.5, phone: 4.2, side: "back" },
  },
  envelope: { name: "envelope", width: 15.5, phone: 7.6, head: 0.78 },
  camera: {
    name: "camera",
    width: 12,
    phone: 6.2,
    head: 0.56,
    scenery: { name: "tripod", width: 8, phone: 4.4, side: "back" },
  },
  listen: { name: "listen", width: 9.5, phone: 4.2, head: 0.53 },
  "wait-phone": { name: "wait-phone", width: 19, phone: 9.6, head: 0.56 },
  sniff: {
    name: "sniff",
    width: 15,
    phone: 8,
    head: 0.84,
    scenery: { name: "kennel", width: 10.5, phone: 5.6, side: "front" },
  },
  watch: { name: "watch", width: 17, phone: 9, head: 0.8 },
} satisfies Record<string, Pose>;

export const GUIDE: Record<GuideMood, { pose: Pose; line: string }> = {
  pick: { pose: POSES.wave, line: `سلام! اول بگو کدوم رفیقم بیاد پیش ${TRAINER}.` },
  when: { pose: POSES.calendar, line: `حالا بگو معمولاً کی وقت داری تا ${TRAINER} زنگ بزنه.` },
  ready: { pose: POSES.envelope, line: "آماده‌ست! عکس و فیلم هم اگه داری، بذار." },
  photos: { pose: POSES.camera, line: `عکساش رسید! ${TRAINER} بهتر می‌شناستش.` },
  sending: { pose: POSES.envelope, line: "دارم می‌برمش…" },
  failed: { pose: POSES.listen, line: "یه جاش جا مونده؛ قرمزها رو ببین." },
  serverFailed: { pose: POSES.listen, line: "نشد بفرستمش؛ پایینِ فرم نوشته چرا." },
  sent: { pose: POSES["wait-phone"], line: `رسید! منتظر زنگ ${TRAINER} می‌مونیم.` },
  noDogs: { pose: POSES.sniff, line: "رفیقم کجاست؟ اول معرفیش کن!" },
  nothing: { pose: POSES.watch, line: "همه‌ی رفیقام یا منتظر زنگن یا ارزیابی شدن!" },
};

/*===== Next Steps =====*/
// What happens after the request, from the FAQ's «ارزیابی رایگان چیه؟» and «بعد از خرید» answers (app-spec F3, F5,
// F6). `label` is the stop's short name on the receipt's road; `line` the plain sentence.
export const NEXT_STEPS = [
  {
    label: `زنگ ${TRAINER}`,
    line: `${TRAINER} بهت زنگ می‌زنه، با هم هماهنگ می‌کنید و سگت رو از نزدیک می‌بینه.`,
  },
  { label: "دوره‌ها باز می‌شن", line: "بعد از ارزیابی، دوره‌هایی که برای سگت مناسبه باز می‌شن." },
  {
    label: "خرید و آموزش",
    line: `بعد از خرید، ${TRAINER} زنگ می‌زنه و جلسه‌ها رو با هم هماهنگ می‌کنید.`,
  },
] as const;
