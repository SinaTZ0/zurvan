import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

/*===== Storybook Config =====*/
const config: StorybookConfig = {
  stories: ["../app/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  /*------ Vite ------*/
  // Storybook reuses vite.config.ts, but TanStack Start's and Nitro's plugins expect to own the app entry and the
  // server build, and break the Storybook build, so strip them and keep everything else (Tailwind, React, paths).
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: (viteConfig.plugins ?? [])
      .flat(Infinity as 1)
      .filter((plugin: PluginOption) => {
        const name = plugin && typeof plugin === "object" && "name" in plugin ? plugin.name : "";
        return !/^(tanstack|nitro:|fullstack:)/.test(name);
      }),
  }),
};

export default config;
