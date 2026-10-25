/*===== Publish Handoff =====*/
// «ذخیره و انتشار» on a new post first creates it, then publishes it. When the publish is refused, the post exists and
// the page moves to its edit address, where a fresh form mounts: the refusal's field messages are handed over here, by
// the new post's id, so that form can show them next to their fields. In memory only: a reload simply drops them.

const pending = new Map<string, Record<string, string>>();

/** Keeps what a refused publish said, for the edit form of post `id`. */
export function handOffPublishProblems({ id, fields }: { id: string; fields: Record<string, string> }) {
  pending.set(id, fields);
}

/** What a refused publish left for post `id`, if anything. */
export function peekPublishProblems(id: string): Record<string, string> | undefined {
  return pending.get(id);
}

/** Drops what was left for post `id`, once its form has shown it. */
export function forgetPublishProblems(id: string) {
  pending.delete(id);
}
