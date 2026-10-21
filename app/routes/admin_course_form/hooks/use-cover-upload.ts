import { isDefinedError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { formatNumberFa } from "~/lib/digits";
import { orpc } from "~/orpc/client";
import { MEDIA_MAX_BYTES } from "~/orpc/media/constants";
import type { Media } from "~/orpc/media/contract";

const MAX_MB = MEDIA_MAX_BYTES / (1024 * 1024);

/*===== Cover Upload =====*/
/**
 * Uploads a picked image as a `course` photo at once (docs/media.md, "Upload Flow"), so saving the form only sends its
 * id. While it runs, the picked file shows from memory (`preview`); a failure leaves `problem` with the API's own
 * message about the file, and the cover that was there stays.
 */
export function useCoverUpload({ onUploaded }: { onUploaded: (media: Media) => void }) {
  const upload = useMutation(orpc.media.upload.mutationOptions());
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // The picked file's object URL lives only while it is shown.
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  /** Starts the upload; ignored while one is running. */
  function pick(file: File | undefined) {
    if (!file || upload.isPending) return;
    setProblem(null);
    if (file.size > MEDIA_MAX_BYTES) {
      setProblem(`این عکس از ${formatNumberFa(MAX_MB)} مگابایت بزرگ‌تره. یه عکس کوچیک‌تر انتخاب کن.`);
      return;
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(
      { kind: "course", file },
      {
        onSuccess: onUploaded,
        onError: (error) => {
          const fieldMessage =
            isDefinedError(error) && error.code === "INVALID_INPUT" ? error.data.fields.file : undefined;
          setProblem(fieldMessage ?? "عکس بار نشد. دوباره امتحان کن.");
        },
        onSettled: () => setPreview(null),
      },
    );
  }

  return { pick, isPending: upload.isPending, preview, problem };
}
