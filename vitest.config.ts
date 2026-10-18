import { defineConfig } from "vitest/config";

/*===== Vitest Config =====*/
// Kept separate from vite.config.ts so the React Router plugin doesn't run during unit tests.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["app/**/*.test.{ts,tsx}"],
    environment: "node",
    // The integration tests share one database, and some of them count money across it (the dashboard's totals): a
    // payment settled by another file in the middle of such a count would fail it now and then. One file at a time.
    fileParallelism: false,
    passWithNoTests: true,
  },
});
