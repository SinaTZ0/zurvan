/*===== Rebuild Notice =====*/
// A stand-in for a page whose feature changed in docs/app-spec.md and has not been rebuilt yet
// (docs/legacy-pages.md, "Rebuild"). It says so plainly and holds no data, so it can't break with the backend.
export function RebuildNotice({ title }: { title: string }) {
  return (
    <section aria-labelledby="rebuild-notice-title" className="site-container py-16">
      <h1 id="rebuild-notice-title" className="text-2xl font-extrabold">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        این صفحه در حال بازسازی است و به‌زودی برمی‌گردد.
      </p>
    </section>
  );
}
