import { inArray } from "drizzle-orm";

import type { Database, Transaction } from "~/db/client.server";
import { behaviorRequest, behaviorRequestVideo } from "~/db/schema";
import { deleteObjects, putObject, videoKey } from "~/lib/storage.server";
import { BEHAVIOR_VIDEO_CONTENT_TYPES, type BehaviorProblemCategory } from "~/orpc/behavior-request/constants";
import {
  declineBehaviorRequest,
  proposeBehaviorPlan,
  submitBehaviorRequest,
  withdrawBehaviorRequest,
} from "~/orpc/behavior-request/service";
import { expireDueRequests, insertVideo } from "~/orpc/behavior-request/repository";
import { parseVideoFormat } from "~/orpc/behavior-request/video";

/*===== Demo Behavior Requests =====*/
// Built through the real services, at moments in the past (the services take `now`), so every status the screens show
// exists: a plan waiting to be paid, a request waiting for Arman, and Leo's older ones (expired, declined, withdrawn).

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/*===== Reset =====*/
/**
 * Detaches the demo customers' requests from their order items, so the training reset can delete the items. Runs
 * before `removeDemoTraining`.
 */
export async function detachDemoBehavior({ tx, customerIds }: { tx: Transaction; customerIds: string[] }) {
  if (customerIds.length === 0) return;
  await tx.update(behaviorRequest).set({ orderItemId: null }).where(inArray(behaviorRequest.customerId, customerIds));
}

/**
 * Deletes the demo customers' requests and videos (those they uploaded and never sent included). Runs after
 * `removeDemoTraining`, which has removed the enrollments and order items that point at the requests.
 *
 * @returns The bucket keys of the deleted videos; delete them once the transaction commits, since the bucket can't be
 * rolled back.
 */
export async function removeDemoBehavior({
  tx,
  customerIds,
}: {
  tx: Transaction;
  customerIds: string[];
}): Promise<string[]> {
  if (customerIds.length === 0) return [];

  const videos = await tx
    .delete(behaviorRequestVideo)
    .where(inArray(behaviorRequestVideo.uploadedBy, customerIds))
    .returning({ id: behaviorRequestVideo.id, format: behaviorRequestVideo.format });
  await tx.delete(behaviorRequest).where(inArray(behaviorRequest.customerId, customerIds));

  return videos.map((video) => videoKey({ videoId: video.id, format: parseVideoFormat(video.format) }));
}

/** Deletes the objects of removed videos from the bucket. */
export async function deleteDemoVideoObjects({ keys }: { keys: string[] }) {
  await deleteObjects({ keys });
}

/*===== Videos =====*/
/**
 * A tiny `ftyp` box with the `isom` brand: it passes the format check, though there is no picture in it. No ffmpeg is
 * available to make a real clip; a customer who uploads a real video through the form gets a playable one.
 */
function placeholderVideo(): Buffer {
  const box = Buffer.alloc(24);
  box.writeUInt32BE(24, 0);
  box.write("ftyp", 4, "latin1");
  box.write("isom", 8, "latin1");
  box.writeUInt32BE(0x200, 12);
  box.write("isomiso2", 16, "latin1");
  return box;
}

/** Stores a video as the customer's upload would have: an object in the bucket and an unsent row. */
async function uploadVideo({ db, customerId, fileName }: { db: Database; customerId: string; fileName: string }) {
  const body = placeholderVideo();
  const row = await insertVideo({
    db,
    values: { uploadedBy: customerId, format: "mp4", fileName, sizeBytes: body.length },
  });
  await putObject({
    key: videoKey({ videoId: row.id, format: "mp4" }),
    body,
    contentType: BEHAVIOR_VIDEO_CONTENT_TYPES.mp4,
    cacheControl: "private, max-age=0",
  });
  return row.id;
}

/*===== Seed =====*/
type Request = {
  customerId: string;
  dogId: string;
  problemCategory: BehaviorProblemCategory;
  description: string;
  address: string;
  preferredTimes: string;
  videos: string[];
  /** How long ago it was sent. */
  sentAgo: number;
};

/** Sends one request through the service, at a moment in the past, and returns its id. */
async function send({ db, request }: { db: Database; request: Request }): Promise<string> {
  const videoIds = [];
  for (const fileName of request.videos) {
    videoIds.push(await uploadVideo({ db, customerId: request.customerId, fileName }));
  }

  const result = await submitBehaviorRequest({
    db,
    customerId: request.customerId,
    now: new Date(Date.now() - request.sentAgo),
    input: {
      dogId: request.dogId,
      problemCategory: request.problemCategory,
      description: request.description,
      address: request.address,
      preferredTimes: request.preferredTimes,
      videoIds,
    },
  });
  if (result.kind !== "success") throw new Error(`seed: behavior request failed: ${JSON.stringify(result)}`);
  return result.id;
}

async function propose({
  db,
  trainerId,
  id,
  ago,
  sessions,
  price,
  note,
}: {
  db: Database;
  trainerId: string;
  id: string;
  ago: number;
  sessions: number;
  price: number;
  note: string;
}) {
  const result = await proposeBehaviorPlan({
    db,
    trainerId,
    id,
    input: { sessions, price, note },
    now: new Date(Date.now() - ago),
  });
  if (result.kind !== "success") throw new Error(`seed: proposing a plan failed: ${JSON.stringify(result)}`);
}

/**
 * Seeds the demo's behavior requests. Leo's older ones come first and are closed before the next is sent, since a dog
 * has one open request at a time; Pesteh's plan and Rocky's request stay open.
 */
export async function seedBehavior({
  db,
  idByPhone,
  dogIds,
}: {
  db: Database;
  idByPhone: Map<string, string>;
  dogIds: Map<string, string>;
}): Promise<{ requests: number }> {
  const arman = idByPhone.get("09120000001");
  const sara = idByPhone.get("09120000004");
  const maryam = idByPhone.get("09120000006");
  const leo = dogIds.get("لئو");
  const pesteh = dogIds.get("پسته");
  const rocky = dogIds.get("راکی");
  if (!arman || !sara || !maryam || !leo || !pesteh || !rocky) {
    throw new Error("seedBehavior: a demo account or dog is missing.");
  }

  const saraAddress = "تهران، ونک، خیابان ملاصدرا، کوچه‌ی چهارم، پلاک ۱۲، واحد ۴";
  const maryamAddress = "تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۷، طبقه‌ی دوم";

  /*------ Leo: expired ------*/
  // Proposed twelve days ago and never paid, so its week to pay ran out five days ago.
  const expired = await send({
    db,
    request: {
      customerId: sara,
      dogId: leo,
      problemCategory: "play-biting",
      description:
        "وقتی با بچه‌ها بازی می‌کند دست و آستین را می‌گیرد و جدی گاز می‌گیرد. چند بار لباس بچه‌ی همسایه پاره شده.",
      address: saraAddress,
      preferredTimes: "جمعه‌ها صبح یا هر روز بعد از ساعت ۱۸.",
      videos: ["لئو-گاز-گرفتن.mp4"],
      sentAgo: 14 * DAY_MS,
    },
  });
  await propose({
    db,
    trainerId: arman,
    id: expired,
    ago: 12 * DAY_MS,
    sessions: 6,
    price: 90_000_000,
    note: "ویدیو را دیدم. گاز گرفتن لئو بازیگوشانه است ولی شدتش را نمی‌شناسد. شش جلسه کافی است: سه جلسه برای کنترل دهان، سه جلسه با حضور بچه‌ها.",
  });
  // Proposals older than their week are marked expired the next time anything reads them; do it now, so the dog's one
  // open slot is free for the older requests below, which are sent at moments before that deadline.
  await expireDueRequests({ db, now: new Date() });

  /*------ Leo: declined ------*/
  const declined = await send({
    db,
    request: {
      customerId: sara,
      dogId: leo,
      problemCategory: "other",
      description: "از صدای موتور و اسکیت می‌ترسد، پارس می‌کند و گاهی می‌خواهد فرار کند.",
      address: saraAddress,
      preferredTimes: "شنبه‌ها و دوشنبه‌ها بعد از ساعت ۱۷.",
      videos: ["لئو-موتور.mp4", "لئو-اسکیت.mp4"],
      sentAgo: 9 * DAY_MS,
    },
  });
  const declinedResult = await declineBehaviorRequest({
    db,
    trainerId: arman,
    id: declined,
    input: {
      reason:
        "این ترس در برنامه‌ی «سگ اجتماعی» کار می‌شود و برنامه‌ی جدا لازم ندارد. لئو همین حالا آن دوره را شروع کرده؛ جلسه‌ی بعد رویش کار می‌کنیم.",
    },
    now: new Date(Date.now() - 8 * DAY_MS),
  });
  if (declinedResult.kind !== "success") throw new Error(`seed: declining failed: ${JSON.stringify(declinedResult)}`);

  /*------ Leo: withdrawn ------*/
  const withdrawn = await send({
    db,
    request: {
      customerId: sara,
      dogId: leo,
      problemCategory: "scavenging",
      description: "در پیاده‌روی هر چیزی را از کف خیابان برمی‌دارد و می‌خورد.",
      address: saraAddress,
      preferredTimes: "هر روز بعد از ساعت ۱۸.",
      videos: ["لئو-پیاده‌روی.mp4"],
      sentAgo: 6 * DAY_MS,
    },
  });
  const withdrawnResult = await withdrawBehaviorRequest({
    db,
    customerId: sara,
    id: withdrawn,
    now: new Date(Date.now() - 5 * DAY_MS),
  });
  if (withdrawnResult.kind !== "success")
    throw new Error(`seed: withdrawing failed: ${JSON.stringify(withdrawnResult)}`);

  /*------ Pesteh: a plan waiting to be paid ------*/
  const pestehRequest = await send({
    db,
    request: {
      customerId: sara,
      dogId: pesteh,
      problemCategory: "separation-anxiety",
      description:
        "وقتی از خانه بیرون می‌روم ساعت‌ها زوزه می‌کشد و گاهی دستشویی می‌کند. همسایه‌ها شاکی شده‌اند. حتی برای رفتن به سوپرمارکت هم نمی‌توانم تنهایش بگذارم.",
      address: saraAddress,
      preferredTimes: "شنبه‌ها و دوشنبه‌ها بعد از ساعت ۱۷. جمعه صبح هم می‌شود.",
      videos: ["پسته-تنهایی.mp4", "پسته-در-ورودی.mp4"],
      sentAgo: 3 * DAY_MS,
    },
  });
  // Two days ago, so the week to pay ends in five days.
  await propose({
    db,
    trainerId: arman,
    id: pestehRequest,
    ago: 2 * DAY_MS,
    sessions: 8,
    price: 120_000_000,
    note: "ویدیوها را دیدم. این اضطراب جدایی است، نه لجبازی. پسته باید یاد بگیرد تنها ماندن امن است. هشت جلسه برنامه‌ریزی کرده‌ام: چهار جلسه اول با حضور تو و بعد کم‌کم تنهایش می‌گذاریم. بین جلسه‌ها تمرین کوتاه روزانه دارد که توضیح می‌دهم.",
  });

  /*------ Rocky: sent three hours ago, waiting for Arman ------*/
  await send({
    db,
    request: {
      customerId: maryam,
      dogId: rocky,
      problemCategory: "animal-aggression",
      description:
        "وقتی سگ دیگری را در خیابان می‌بیند پارس می‌کند، به سمتش می‌پرد و قلاده را می‌کشد. دو هفته پیش به یک سگ کوچک حمله کرد.",
      address: maryamAddress,
      preferredTimes: "همه‌ی روزها صبح قبل از ۱۰ یا بعد از ساعت ۱۹.",
      videos: ["راکی-خیابان.mp4"],
      sentAgo: 3 * HOUR_MS,
    },
  });

  return { requests: 5 };
}
