import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Empty CMS fields are allowed. Only display safe HTTP links at render time.
const optionalText = z.string().nullish().or(z.literal(''));
const songs = defineCollection({
  loader: glob({ base: './src/content/songs', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1),
    artist: z.string().min(1),
    language: optionalText,
    tags: z.array(z.string()).nullish(),
    spotify_url: optionalText,
    youtube_url: optionalText,
    shazam_url: optionalText,
    recordings: z.union([z.array(z.string()), z.string()]).nullish(),
    duration_seconds: z.number().int().positive().max(3600).nullish()
  })
});
const lists = defineCollection({
  loader: glob({ base: './src/content/lists', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1),
    description: optionalText,
    songs: z.array(z.string()).default([])
  })
});
export const collections = { songs, lists };
