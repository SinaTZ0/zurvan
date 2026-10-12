import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { VideoPlayer } from "~/components/video-player";
import { formatFileSize } from "~/lib/file-format";
import type { BehaviorVideo } from "~/orpc/behavior-request/contract";

/*===== Request Videos =====*/
/**
 * The videos the customer sent, one row each. A play button opens the player in a dialog.
 *
 * The player is mounted only while a video is chosen, and the choice is cleared as soon as the dialog closes, so the
 * clip stops at once instead of playing through the closing animation.
 */
export function RequestVideos({ videos, dogName }: { videos: BehaviorVideo[]; dogName: string }) {
  const [active, setActive] = useState<BehaviorVideo | null>(null);

  return (
    <>
      <ul className="divide-y rounded-xl border">
        {videos.map((video) => (
          <li key={video.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span dir="auto" className="block truncate font-bold">
                {video.fileName}
              </span>
              <span className="text-muted-foreground">{formatFileSize(video.sizeBytes)}</span>
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => setActive(video)}>
              پخش
              <span className="sr-only">
                {" "}
                {video.fileName} برای {dogName}
              </span>
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>ویدیوی رفتار {dogName}</DialogTitle>
          </DialogHeader>
          {active && <VideoPlayer video={active} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
