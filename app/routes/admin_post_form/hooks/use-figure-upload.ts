import { isDefinedError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { formatNumberFa } from "~/lib/digits";
import { orpc } from "~/orpc/client";
import { MEDIA_MAX_BYTES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";

const MAX_MB = MEDIA_MAX_BYTES / (1024 * 1024);

/*===== Types =====*/
/** One image on its way into the text: the picked file shown from memory, then the upload's outcome. */
export type FigureUpload =
  | { status: "uploading"; preview: string }
  | { status: "ready"; preview: string; media: Media }
  | { status: "failed"; preview: string | null; problem: string };

/*===== Figure Upload =====*/
/**
 * Uploads a picked image as a `figure` at once (docs/media.md, "Upload Flow"), so the editor only stores its id and
 * the dialog can ask for her words while it travels. A newer pick replaces an older one: the older answer is ignored
 * when it comes. A failure keeps the API's own message about the file. The picked file's object URL lives until the
 * upload is cleared or replaced.
 */
export function useFigureUpload() {
  const upload = useMutation(orpc.media.upload.mutationOptions());
  const [state, setState] = useState<FigureUpload | null>(null);
  const session = useRef(0);

  // The object URL is freed when the picture it shows goes away.
  const preview = state?.preview ?? null;
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  /** Starts uploading `file`, dropping any upload still running. */
  function start(file: File) {
    const current = ++session.current;
    if (file.size > MEDIA_MAX_BYTES) {
      setState({
        status: "failed",
        preview: null,
        problem: `این عکس از ${formatNumberFa(MAX_MB)} مگابایت بزرگ‌تره. یه عکس کوچیک‌تر انتخاب کن.`,
      });
      return;
    }

    const shown = URL.createObjectURL(file);
    setState({ status: "uploading", preview: shown });
    upload.mutate(
      { kind: "figure", file },
      {
        onSuccess: (media) => {
          if (session.current === current) setState({ status: "ready", preview: shown, media });
        },
        onError: (error) => {
          if (session.current !== current) return;
          const fieldMessage =
            isDefinedError(error) && error.code === "INVALID_INPUT" ? error.data.fields.file : undefined;
          setState({ status: "failed", preview: shown, problem: fieldMessage ?? "عکس بار نشد. دوباره امتحان کن." });
        },
      },
    );
  }

  /** Forgets the upload (the dialog closed); an answer still on its way is ignored. */
  function clear() {
    session.current += 1;
    setState(null);
  }

  return { upload: state, uploading: state?.status === "uploading", start, clear };
}
