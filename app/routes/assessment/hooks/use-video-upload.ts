import { useCallback, useEffect, useRef } from "react";

import { EVALUATION_VIDEOS_PATH } from "~/orpc/evaluation/constants";
import type { EvaluationVideo } from "~/orpc/evaluation/contract";

const GENERIC_MESSAGE = "ویدیو بارگذاری نشد. دوباره امتحان کن.";

/** What `POST /api/evaluation-videos` answers on a refusal. */
type VideoErrorBody = { errors?: string[]; fields?: { file?: string } };

/*===== Video Upload =====*/
/**
 * Uploads evaluation videos to the resource route (docs/media.md, "Videos").
 *
 * This is hand-written `XMLHttpRequest` on purpose: it is the one place the app does not use oRPC or `fetch`, because
 * `fetch` cannot report upload progress and a 100 MB video needs a progress bar. The route answers 201 with the
 * `EvaluationVideo`, or `{ errors, fields: { file } }` with a Persian message.
 *
 * `upload` rejects with an `Error` whose message is Persian and ready to show. Calls run concurrently, each tracked by
 * the caller's `key` so `cancel` can abort one.
 */
export function useVideoUpload() {
  const requests = useRef(new Map<string, XMLHttpRequest>());

  const upload = useCallback(
    ({
      key,
      file,
      onProgress,
    }: {
      key: string;
      file: File;
      /** Percent of the body sent, 0 to 100. It reaches 100 before the server has finished storing the file. */
      onProgress: (percent: number) => void;
    }) =>
      new Promise<EvaluationVideo>((resolve, reject) => {
        const request = new XMLHttpRequest();
        requests.current.set(key, request);
        const finish = () => requests.current.delete(key);

        request.open("POST", EVALUATION_VIDEOS_PATH);
        // Same origin, so the session cookie goes along without further options.
        request.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        });
        request.addEventListener("load", () => {
          finish();
          if (request.status === 201) {
            try {
              resolve(JSON.parse(request.responseText) as EvaluationVideo);
              return;
            } catch {
              reject(new Error(GENERIC_MESSAGE));
              return;
            }
          }
          let body: VideoErrorBody = {};
          try {
            body = JSON.parse(request.responseText) as VideoErrorBody;
          } catch {
            // A proxy's HTML error page (413 from nginx, for example) is not ours to show.
          }
          reject(new Error(body.fields?.file ?? body.errors?.[0] ?? GENERIC_MESSAGE));
        });
        request.addEventListener("error", () => {
          finish();
          reject(new Error(GENERIC_MESSAGE));
        });
        request.addEventListener("abort", () => {
          finish();
          reject(new DOMException("Upload cancelled", "AbortError"));
        });

        const body = new FormData();
        body.append("file", file);
        request.send(body);
      }),
    [],
  );

  const cancel = useCallback((key: string) => {
    requests.current.get(key)?.abort();
  }, []);

  /** Frees the server's copy of a video the customer removed. Best effort: the sweep job catches what this misses. */
  const discard = useCallback((videoId: string) => {
    void fetch(`${EVALUATION_VIDEOS_PATH}/${encodeURIComponent(videoId)}`, { method: "DELETE" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const running = requests.current;
    return () => running.forEach((request) => request.abort());
  }, []);

  return { upload, cancel, discard };
}
