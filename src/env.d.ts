/// <reference types="astro/client" />

import type { renderUniqueStylesheet } from "astro/runtime/server/index.js";

type KVNamespace = import("@cloudflare/workers-types/experimental").KVNamespace;

type ENV = PROD_ENV | STAGE_ENV;

type PROD_ENV = {
  ENVIRONMENT: "production";
  GITHUB_TOKEN: string;
  OPENAI_API_KEY: string;
  PUBLIC_NOTION_SECRET: string;
  TODOIST_AUTO_LABEL_SECRET: string;
  TODOIST_CLIENT_SECRET: string;
};

type STAGE_ENV = {
  environment: "stage";
  GITHUB_TOKEN: string;
  OPENAI_API_KEY: string;
  PUBLIC_NOTION_SECRET: string;
  TODOIST_CLIENT_SECRET: string;
};

type Runtime = import("@astrojs/cloudflare").DirectoryRuntime<ENV>;

declare namespace App {
  interface Locals extends Runtime {
    user: {
      name: string;
      surname: string;
    };
  }
}