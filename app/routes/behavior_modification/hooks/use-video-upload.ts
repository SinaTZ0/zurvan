import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import type { BehaviorVideo } from "~/orpc/behavior-request/contract";
import { BEHAVIOR_VIDEO_MAX_COUNT, BEHAVIOR_VIDEOS_PATH } from "~/orpc/behavior-request/constants";

/*===== Video Upload =====*/
export type VideoTile = {
  localId: string;
  file: File;
  /** An object URL of the picked file, for the first frame. Revoked when the tile goes. */
  previewUrl: string;
  status: "uploading" | "uploaded" | "failed";
  /** 0 to 1, from the XHR upload events. */
  progress: number;
  video: BehaviorVideo | null;
  error: string | null;
};

type Live = { previewUrl: string; xhr: XMLHttpRequest | null };

const errorBodySchema = z.object({
  errors: z.array(z.string()).default([]),
  fields: z.record(z.string(), z.string()).default({}),
});

/**
 * Uploads each picked video as soon as it is chosen, so the form only sends ids. Uses XHR (not fetch) for the upload
 * progress. A tile that is removed while its bytes are still going is aborted; one that finishes after its removal is
 * deleted on the server, since nothing on the page can reach it any more.
 */
export function useVideoUpload() {
  const [tiles, setTiles] = useState<VideoTile[]>([]);
  // The latest tiles, read synchronously by `add` and `remove`: state updates are asynchronous and two picks in a row
  // would otherwise both see an empty list.
  const tilesRef = useRef<VideoTile[]>([]);
  const live = useRef(new Map<string, Live>());

  const commit = useCallback((next: VideoTile[]) => {
    tilesRef.current = next;
    setTiles(next);
  }, []);

  const patch = useCallback(
    (localId: string, changes: Partial<VideoTile>) => {
      commit(tilesRef.current.map((tile) => (tile.localId === localId ? { ...tile, ...changes } : tile)));
    },
    [commit],
  );

  // Leaving the page drops the previews and any upload still running.
  useEffect(() => {
    const entries = live.current;
    return () => {
      for (const entry of entries.values()) {
        entry.xhr?.abort();
        URL.revokeObjectURL(entry.previewUrl);
      }
      entries.clear();
    };
  }, []);

  const upload = useCallback(
    (tile: VideoTile) => {
      const xhr = new XMLHttpRequest();
      const body = new FormData();
      body.append("file", tile.file);

      xhr.open("POST", BEHAVIOR_VIDEOS_PATH);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) patch(tile.localId, { progress: event.loaded / event.total });
      };
      xhr.onload = () => {
        const entry = live.current.get(tile.localId);
        const video = xhr.status === 201 ? readVideo(xhr.responseText) : null;
        if (!entry) {
          // Removed while the bytes were on their way.
          if (video) void deleteVideo(video.id);
          return;
        }
        entry.xhr = null;
        if (video) patch(tile.localId, { status: "uploaded", progress: 1, video, error: null });
        else patch(tile.localId, { status: "failed", error: describeUploadFailure(xhr) });
      };
      xhr.onerror = () => {
        if (!live.current.has(tile.localId)) return;
        patch(tile.localId, { status: "failed", error: "ویدیو فرستاده نشد. اتصالت را بررسی کن و دوباره بفرست." });
      };

      const entry = live.current.get(tile.localId);
      if (entry) entry.xhr = xhr;
      xhr.send(body);
    },
    [patch],
  );

  /**
   * Takes the picked files up to the limit and starts their uploads.
   * @returns How many were refused because the limit was reached.
   */
  const add = useCallback(
    (files: File[]) => {
      const room = Math.max(0, BEHAVIOR_VIDEO_MAX_COUNT - tilesRef.current.length);
      const accepted = files.slice(0, room);

      const created = accepted.map((file, index): VideoTile => {
        const localId = `${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`;
        const previewUrl = URL.createObjectURL(file);
        live.current.set(localId, { previewUrl, xhr: null });
        return { localId, file, previewUrl, status: "uploading", progress: 0, video: null, error: null };
      });

      commit([...tilesRef.current, ...created]);
      for (const tile of created) upload(tile);
      return files.length - accepted.length;
    },
    [commit, upload],
  );

  const remove = useCallback(
    (localId: string) => {
      const tile = tilesRef.current.find((item) => item.localId === localId);
      if (!tile) return;

      const entry = live.current.get(localId);
      entry?.xhr?.abort();
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      live.current.delete(localId);

      commit(tilesRef.current.filter((item) => item.localId !== localId));
      if (tile.video) void deleteVideo(tile.video.id);
    },
    [commit],
  );

  return {
    tiles,
    add,
    remove,
    /** The ids of the finished uploads, in the order they were picked. */
    uploadedIds: tiles.flatMap((tile) => (tile.video ? [tile.video.id] : [])),
    uploading: tiles.some((tile) => tile.status === "uploading"),
  };
}

/*===== Helpers =====*/
function readVideo(text: string): BehaviorVideo | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null && "id" in parsed && typeof parsed.id === "string"
      ? (parsed as BehaviorVideo)
      : null;
  } catch {
    return null;
  }
}

/** The route's own Persian message: `fields.file` for a rejected file, `errors` for a refused request. */
function describeUploadFailure(xhr: XMLHttpRequest): string {
  let body: unknown = null;
  try {
    body = JSON.parse(xhr.responseText);
  } catch {
    body = null;
  }
  const parsed = errorBodySchema.safeParse(body);
  if (parsed.success) {
    const message = parsed.data.fields.file ?? parsed.data.errors[0];
    if (message) return message;
  }
  return "ویدیو فرستاده نشد. دوباره امتحان کن.";
}

/** A removed video is best effort: if the call fails the video stays unsent and counts against the upload limit. */
function deleteVideo(id: string) {
  return fetch(`${BEHAVIOR_VIDEOS_PATH}/${id}`, { method: "DELETE" }).catch(() => undefined);
}
