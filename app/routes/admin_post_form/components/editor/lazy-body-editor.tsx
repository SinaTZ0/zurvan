import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import type { BodyEditorProps } from "~/routes/admin_post_form/components/editor/body-editor";

/*===== Lazy Body Editor =====*/
// Lexical runs only in the browser and only on this form: the editor is its own chunk, loaded after hydration. The
// type import above is erased, so nothing of Lexical reaches the server render or the public pages.
const BodyEditor = lazy(() => import("~/routes/admin_post_form/components/editor/body-editor"));

/**
 * The post editor behind `ClientOnly` and `React.lazy`, with a skeleton in the sheet's shape (the toolbar's band and a
 * few lines) while the server renders and while the chunk loads, so the plate doesn't jump when it arrives.
 */
export function LazyBodyEditor(props: BodyEditorProps) {
  const skeleton = <EditorSkeleton compact={props.compact ?? false} />;
  return (
    <ClientOnly fallback={skeleton}>
      <Suspense fallback={skeleton}>
        <BodyEditor {...props} />
      </Suspense>
    </ClientOnly>
  );
}

/*===== Skeleton =====*/
function EditorSkeleton({ compact }: { compact: boolean }) {
  return (
    <div aria-busy className="rounded-2xl bg-background ring-1 ring-foreground/15">
      <span className="sr-only">ویرایشگر داره باز می‌شه…</span>
      <div
        aria-hidden
        className="flex h-[3.25rem] items-center gap-1.5 rounded-t-2xl border-b border-foreground/10 bg-card/95 px-3"
      >
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={index}
            className="size-8 shrink-0 animate-pulse rounded-lg bg-foreground/6 motion-reduce:animate-none"
          />
        ))}
      </div>
      <div aria-hidden className="px-5 py-6 sm:px-9 sm:py-9">
        <div className={`mx-auto flex max-w-[65ch] flex-col gap-4 ${compact ? "min-h-[12rem]" : "min-h-[22rem]"}`}>
          {["w-11/12", "w-full", "w-4/5", "w-2/3"].map((width) => (
            <span
              key={width}
              className={`h-4 ${width} animate-pulse rounded-full bg-foreground/6 motion-reduce:animate-none`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
