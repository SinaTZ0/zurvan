import { db } from "~/db/client.server";
import { auth } from "~/lib/auth.server";
import type { UserRole } from "~/lib/user-constants";
import { BEHAVIOR_VIDEO_MAX_BYTES } from "~/orpc/behavior-request/constants";
import { uploadBehaviorVideo } from "~/orpc/behavior-request/service";

import type { Route } from "./+types/api-behavior-videos";

/*===== Behavior Video Upload =====*/
// Resource route (no default export). A video is too big for the RPC handler's in-memory JSON/multipart path and the
// form wants upload progress, so it has its own endpoint: `POST /api/behavior-videos` with a multipart `file`. The
// response is the `BehaviorVideo` the request form then sends back by id.

/** The multipart envelope adds a little to the file, so the header limit leaves room for it. */
const BODY_SLACK_BYTES = 1024 * 1024;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function fileError(message: string, status: number) {
  return json({ errors: [], fields: { file: message } }, status);
}

/** Only POST is accepted: a GET on the collection has nothing to show. */
export function loader() {
  return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });

  /*------ Who ------*/
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.status === "blocked") return json({ errors: ["اول وارد شو."], fields: {} }, 401);
  // Better-Auth types additional fields as optional, but the column is NOT NULL with a default.
  const role = session.user.role as UserRole;
  if (role !== "customer") return json({ errors: ["این بخش مخصوص صاحبان سگ است."], fields: {} }, 403);

  /*------ Size, Before Reading the Body ------*/
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > BEHAVIOR_VIDEO_MAX_BYTES + BODY_SLACK_BYTES) {
    return fileError("حجم ویدیو باید کمتر از ۱۰۰ مگابایت باشد.", 413);
  }

  /*------ File ------*/
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fileError("ویدیو را دوباره بفرست.", 422);
  }
  if (!(file instanceof File)) return fileError("ویدیو را انتخاب کن.", 422);

  const result = await uploadBehaviorVideo({ db, user: { id: session.user.id, role }, file });
  if (result.kind === "forbidden") return json({ errors: [], fields: {} }, 403);
  if (result.kind === "invalid") return fileError(result.message, 422);

  return json(result.video, 201);
}
