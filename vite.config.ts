import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Compiles `messages/` into `app/paraglide/` (gitignored) and recompiles as they change. Its options live in
    // `project.inlang/paraglide.config.ts`, shared with `npm run i18n:compile`.
    paraglideVitePlugin({ project: "./project.inlang" }),
    tailwindcss(),
    // Routes are declared in code (`app/routes.ts`) over the flat slices in `app/routes/`.
    tanstackStart({ srcDirectory: "app", router: { virtualRouteConfig: "./app/routes.ts" } }),
    // The Node server (`node .output/server/index.mjs`). Static assets ship pre-compressed; Caddy compresses the HTML.
    nitro({ compressPublicAssets: true }),
    // React's plugin must come after Start's. Version 6 transforms with Oxc, no Babel; its optional Babel peer chain
    // would pull Babel 8 against shadcn's Babel 7, hence the `@babel/plugin-transform-runtime` override in package.json.
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
