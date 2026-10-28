import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const songs = defineCollection({
  loader: glob({ base: './src/content/songs', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1), artist: z.string().min(1),
    language: z.string().nullish(), tags: z.array(z.string()).nullish()
  })
});
export const collections = { songs };
