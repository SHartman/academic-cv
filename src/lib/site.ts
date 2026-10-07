import { parse } from 'yaml';
import { z } from 'astro/zod';
import raw from '../data/site.yaml?raw';

const schema = z.object({
  name: z.string(),
  fullName: z.string(),
  descriptor: z.string(),
  position: z.string(),
  department: z.string(),
  institution: z.string(),
  statement: z.string(),
  self: z.object({ family: z.string(), givenInitial: z.string(), citeAs: z.string().optional() }),
  email: z.email(),
  links: z.array(z.object({ label: z.string(), href: z.string() })),
  outreachSite: z.url(),
  features: z.object({ software: z.boolean().default(false) }),
});

const result = schema.safeParse(parse(raw));
if (!result.success) {
  throw new Error(`src/data/site.yaml has a problem:\n${z.prettifyError(result.error)}`);
}

export const site = result.data;
