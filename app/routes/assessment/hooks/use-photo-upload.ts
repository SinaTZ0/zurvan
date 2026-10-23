import { safe } from "@orpc/client";
import { useCallback, useEffect, useRef } from "react";

import { client } from "~/orpc/client";
import type { Media } from "~/orpc/media/contract";
import { m } from "~/paraglide/messages";

/** iPhone photos: the server refuses them with its own message, this is the fallback if it has none. */
function looksLikeHeic(file: File): boolean {
  return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/*===== Photo Upload =====*/
/**
 * Uploads evaluation photos one file at a time through `media.upload` (docs/media.md, "Upload Flow"). Several calls can
 * run at once, each tracked by the caller's `key` so a row removed mid-upload can be cancelled.
 *
 * `upload` rejects with an `Error` whose message is already in the page's language and ready to show. The fallbacks
 * are worded when the upload fails, never at import.
 */
export function usePhotoUpload() {
  const controllers = useRef(new Map<string, AbortController>());

  const upload = useCallback(async ({ key, file }: { key: string; file: File }): Promise<Media> => {
    const controller = new AbortController();
    controllers.current.set(key, controller);
    try {
      const { error, data, definedError } = await safe(
        client.media.upload({ kind: "evaluation", file }, { signal: controller.signal }),
      );
      if (!error) return data;

      // The server's own message (a HEIC file, too many pixels, ...) is the most helpful one.
      const serverMessage = definedError?.code === "INVALID_INPUT" ? definedError.data.fields.file : undefined;
      throw new Error(
        serverMessage ?? (looksLikeHeic(file) ? m.assessment_photo_error_heic() : m.assessment_photo_error_generic()),
        { cause: error },
      );
    } finally {
      controllers.current.delete(key);
    }
  }, []);

  const cancel = useCallback((key: string) => {
    controllers.current.get(key)?.abort();
  }, []);

  // Leaving the page drops whatever is still in flight.
  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((controller) => controller.abort());
  }, []);

  return { upload, cancel };
}
