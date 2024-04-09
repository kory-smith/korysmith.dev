import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
		publishedDate: z.date(),
		description: z.string(),
    status: z.union([z.literal('published'), z.literal('draft')]),
  }),
});

// Pages like about, things-i-use, etc.
const standaloneCollection = defineCollection({
  type: 'content', // v2.5.0 and later
  schema: z.object({
    title: z.string(),
		publishedDate: z.date(),
		description: z.string(),
  }),  
})

export const collections = {
  'blog': blogCollection,
  'standalone': standaloneCollection,
};