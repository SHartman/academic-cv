// Content schemas. If you mistype a field in one of the YAML or Markdown files,
// the build stops with a message pointing at the entry and field to fix.
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

export const THEMES = ['flight', 'physiology', 'anatomy'] as const;
export const PUB_TYPES = ['article', 'chapter', 'book', 'thesis', 'preprint', 'abstract'] as const;

// Volume/issue/pages may be written as numbers in YAML; store them as text.
const text = z.union([z.string(), z.number()]).transform(String);
// Dates written as 2026, 2026-05 or 2026-05-18 (YAML may hand us a Date for the last form).
const looseDate = z
  .union([z.string(), z.number(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v)))
  .refine((v) => /^\d{4}(-\d{2}(-\d{2})?)?$/.test(v), 'Use YYYY, YYYY-MM or YYYY-MM-DD');

const publications = defineCollection({
  loader: file('src/data/publications.yaml'),
  schema: z.object({
    type: z.enum(PUB_TYPES),
    format: z.enum(['talk', 'poster']).optional(), // for type: abstract
    year: z.number().int(),
    month: z.number().int().min(1).max(12).optional(),
    title: z.string(),
    authors: z.array(z.string()).min(1),
    contribution: z.string().optional(),
    journal: z.string().optional(),
    book: z.string().optional(),
    venue: z.string().optional(),
    school: z.string().optional(),
    publisher: z.string().optional(),
    volume: text.optional(),
    issue: text.optional(),
    pages: text.optional(),
    doi: z.string().regex(/^10\.\d{4,9}\/\S+$/, 'Write the bare DOI, e.g. 10.7717/peerj.7247').optional(),
    url: z.url().optional(),
    pdf: z.url().optional(),
    themes: z.array(z.enum(THEMES)).default([]),
    selected: z.boolean().default(false),
    caption: z.string().optional(),
    review: z.string().optional(), // a note to yourself; never shown on the site
    abstract: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: file('src/data/news.yaml', {
    // News items don't need hand-written ids; derive one from date + position.
    parser: (raw) =>
      (parse(raw) ?? []).map((item: Record<string, unknown>, i: number) => ({
        id: `${String(item.date instanceof Date ? item.date.toISOString().slice(0, 10) : item.date)}-${i}`,
        ...item,
      })),
  }),
  schema: z.object({
    date: looseDate,
    text: z.string(),
    link: z.string().optional(),
  }),
});

const research = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/research' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tip: z.string().describe('Short label used on the home-page cladogram'),
      tipNote: z.string().optional(),
      summary: z.string(),
      order: z.number(),
      color: z.enum(['ink', 'red', 'blue']).default('ink'),
      image: image(),
      imageAlt: z.string(),
      // Which part of the figure the home-page card crop keeps, as CSS object-position.
      focus: z.string().default('50% 30%'),
      caption: z.string().optional(),
    }),
});

const software = defineCollection({
  // _template.md is included (keeps the build quiet) but is never shown: visible: false.
  loader: glob({ pattern: '**/*.md', base: './src/content/software' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    // Keep `visible: false` until the tool is public; it then appears only when
    // `features.software` is also true in src/data/site.yaml.
    visible: z.boolean().default(false),
    status: z.enum(['pre-alpha', 'alpha', 'beta', 'released']),
    order: z.number().default(100),
    version: z.string().optional(),
    released: looseDate.optional(),
    platforms: z.array(z.string()).default([]),
    language: z.string().optional(),
    license: z.string().optional(),
    repo: z.url().optional(),
    download: z.url().optional(),
    docs: z.url().optional(),
    paper: z.string().optional().describe('id of the publication that describes the tool'),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string() }),
});

export const collections = { publications, news, research, software, pages };
