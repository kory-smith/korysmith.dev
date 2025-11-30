import { defineConfig, passthroughImageService } from "astro/config";
import { remarkModifiedTime } from "./plugins/remark-modified-time.mjs";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// https://astro.build/config
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

let site = "";
const isProd = process.env.ENVIRONMENT === "production";
if (isProd) {
  site = "https://korysmith.dev";
} else {
  site = "https://stage.korysmith.dev";
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: {
    imageService: passthroughImageService,
  },
  site,
  adapter: cloudflare(),
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: true,
    experimental: {
      clientPrerender: true,
    },
  },
  markdown: {
    shikiConfig: {
      theme: "dracula",
    },
    remarkPlugins: [remarkModifiedTime],
    rehypePlugins: [
      rehypeHeadingIds,
      [
        // https://docs.astro.build/en/guides/markdown-content/#heading-ids-and-plugins
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            class: "heading-anchor",
          },
          content: {
            type: "text",
            value: "#",
          },
        },
      ],
    ],
  },
  integrations: [
    mdx(),
    isProd && sitemap(),
  ],
  });
