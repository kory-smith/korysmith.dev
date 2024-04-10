import { z, defineCollection } from "astro:content";

const blogCollection = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      publishedDate: z.date().optional(),
      description: z.string(),
      status: z.union([
        z.literal("published"),
        z.literal("draft"),
        z.literal("idea"),
      ]),
    })
    .refine(
      (data) => {
        if (data.status === "published" && !data.publishedDate) {
          return false; // If status is 'published', publishedDate must exist
        }
        return true;
      },
      {
        message: "Invalid combination of status and publishedDate",
        path: ["status", "publishedDate"],
      }
    ),
});

// Pages like about, things-i-use, etc.
const standaloneCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    publishedDate: z.date(),
    description: z.string(),
  }),
});

export const collections = {
  blog: blogCollection,
  standalone: standaloneCollection,
};
