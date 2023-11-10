import { defineConfig } from "astro/config";

// https://astro.build/config
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

let site = ""
if (process.env.ENVIRONMENT === "production") {
  site = "https://korysmith.dev"
} else {
  site = "https://stage.korysmith.dev"
} 

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  site,
  adapter: cloudflare({
    mode: "directory",
  }),
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: true,
  },
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    sitemap(),
  ],
});
