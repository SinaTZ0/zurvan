import { db } from "~/db/client.server";
import { auth } from "~/lib/auth.server";
import { getObject, videoKey } from "~/lib/storage.server";
import type { UserRole } from "~/lib/user-constants";
import { BEHAVIOR_VIDEO_CONTENT_TYPES } from "~/orpc/behavior-request/constants";
import { discardBehaviorVideo, findVideoForViewer } from "~/orpc/behavior-request/service";
import { parseVideoFormat } from "~/orpc/behavior-request/video";

import type { Route } from "./+types/api-behavior-video";

/*===== Behavior Video =====*/
// Resource route (no default export). Videos are private: nginx never serves them, so this route is the only way to
// watch one, and it checks who is asking first. `GET` streams the bytes (with ranges, so the player can seek);
// `DELETE` removes a video its uploader hasn't sent yet.

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

async function getViewer(request: Request): Promise<{ id: string; role: UserRole } | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.status === "blocked") return null;
  // Better-Auth types additional fields as optional, but the column is NOT NULL with a default.
  return { id: session.user.id, role: session.user.role as UserRole };
}

/** `bytes=START-END`, `bytes=START-` or `bytes=-SUFFIX`, one range only. Null when it can't be satisfied. */
function parseRange({ header, size }: { header: string; size: number }): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null;

  let start: number;
  let end: number;
  if (!match[1]) {
    // The last N bytes.
    const suffix = Number(match[2]);
    if (suffix === 0) return null;
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  return start <= end && start < size ? { start, end } : null;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const viewer = await getViewer(request);
  if (!viewer) return new Response("Sign in to continue.", { status: 401, headers: { "Cache-Control": "no-store" } });

  const found = await findVideoForViewer({ db, viewer, id: params.id });
  if (found.kind === "not-found") return notFound();
  const { video } = found;
  const format = parseVideoFormat(video.format);

  /*------ Range ------*/
  const rangeHeader = request.headers.get("range");
  let range: { start: number; end: number } | null = null;
  if (rangeHeader) {
    range = parseRange({ header: rangeHeader, size: video.sizeBytes });
    if (!range) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${video.sizeBytes}`, "Cache-Control": "no-store" },
      });
    }
  }

  const stored = await getObject({
    key: videoKey({ videoId: video.id, format }),
    range: range ? `bytes=${range.start}-${range.end}` : undefined,
  });
  if (!stored) return notFound();

  const headers = new Headers({
    "Content-Type": BEHAVIOR_VIDEO_CONTENT_TYPES[format],
    "Content-Length": String(stored.contentLength),
    "Accept-Ranges": "bytes",
    // Private to the signed-in viewer, and an id never changes content.
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
  if (range) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${video.sizeBytes}`);

  return new Response(request.method === "HEAD" ? null : stored.body, { status: range ? 206 : 200, headers });
}

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "DELETE")
    return new Response("Method not allowed", { status: 405, headers: { Allow: "DELETE" } });

  const viewer = await getViewer(request);
  if (!viewer) return new Response("Sign in to continue.", { status: 401, headers: { "Cache-Control": "no-store" } });

  const result = await discardBehaviorVideo({ db, userId: viewer.id, id: params.id });
  return result.kind === "success" ? new Response(null, { status: 204 }) : notFound();
}
