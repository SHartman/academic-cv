import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { marked } from 'marked';
import { site } from './site';

export type Pub = CollectionEntry<'publications'>;
export type PubData = Pub['data'];

/** Render a short Markdown string (titles, news items) to inline HTML. */
export const inline = (md: string): string => marked.parseInline(md, { async: false });

/** Strip Markdown emphasis for plain-text contexts (meta tags, BibTeX titles). */
export const plain = (md: string): string => md.replace(/\*([^*]+)\*/g, '$1');

export const isPaper = (p: PubData) => p.type !== 'abstract';

export const TYPE_LABEL: Record<PubData['type'], string> = {
  article: 'Journal article',
  chapter: 'Book chapter',
  book: 'Book',
  thesis: 'Dissertation',
  preprint: 'Preprint',
  abstract: 'Conference abstract',
};

/** "Conference talk", "Poster", or the plain type label. */
export const kindLabel = (p: PubData) =>
  p.format === 'talk' ? 'Conference talk' : p.format === 'poster' ? 'Conference poster' : TYPE_LABEL[p.type];

// ── Authors ───────────────────────────────────────────────────────────────────

/** "Hartman, Scott A." → { family: "Hartman", initials: "SA" } */
export function splitName(name: string) {
  const [family, given = ''] = name.split(',').map((s) => s.trim());
  const initials = given
    .split(/[\s.\-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .join('');
  return { family, given, initials };
}

export function isSelf(name: string) {
  const { family, initials } = splitName(name);
  return family === site.self.family && initials.startsWith(site.self.givenInitial);
}

/** Vancouver-style short names, flagging the site owner for highlighting. */
export const authorList = (p: PubData) =>
  p.authors.map((a) => {
    const { family, initials } = splitName(a);
    return { text: initials ? `${family} ${initials}` : family, self: isSelf(a) };
  });

// ── Citation pieces ───────────────────────────────────────────────────────────

const volIssue = (p: PubData) =>
  [p.volume, p.issue ? `(${p.issue})` : ''].join('') + (p.pages ? `: ${p.pages}` : '');

/** Where it appeared, as inline HTML (journal names italicised). */
export function source(p: PubData, { full = false } = {}): string {
  const j = (name: string) => `<i>${name}</i>`;
  switch (p.type) {
    case 'article':
    case 'preprint':
      return p.journal ? [j(p.journal), volIssue(p)].filter(Boolean).join(' ') : 'Preprint';
    case 'chapter':
      return `In ${j(p.book ?? '')}${p.pages ? `, pp. ${p.pages}` : ''}${p.publisher ? `. ${p.publisher}` : ''}`;
    case 'book':
      return p.publisher ?? '';
    case 'thesis':
      return `PhD dissertation, ${p.school ?? ''}`;
    case 'abstract': {
      const where = p.venue ?? (p.journal ? j(p.journal) : '');
      if (!full || !p.journal) return where;
      return `${where}. ${j(p.journal)} ${volIssue(p)}`.trim();
    }
  }
}

export const doiUrl = (doi: string) => `https://doi.org/${doi}`;

/** Best link for "read this": the DOI, else a landing page, else the PDF. */
export const primaryUrl = (p: PubData) => (p.doi ? doiUrl(p.doi) : (p.url ?? p.pdf));

export const pubHref = (id: string) => `/publications/${id}/`;

// ── Sorting & loading ─────────────────────────────────────────────────────────

export const byDateDesc = (a: Pub, b: Pub) =>
  b.data.year - a.data.year || (b.data.month ?? 0) - (a.data.month ?? 0) || a.data.title.localeCompare(b.data.title);

export async function allPubs() {
  return (await getCollection('publications')).sort(byDateDesc);
}

// ── Figures: drop <id>.jpg / .png / .webp into src/assets/publications/ ──────

const figures = import.meta.glob<{ default: ImageMetadata }>('../assets/publications/*.{jpg,jpeg,png,webp}', {
  eager: true,
});
export function pubFigure(id: string): ImageMetadata | undefined {
  const hit = Object.entries(figures).find(([path]) => path.split('/').pop()!.replace(/\.\w+$/, '') === id);
  return hit?.[1].default;
}

// ── BibTeX ────────────────────────────────────────────────────────────────────

const BIB_TYPE: Record<PubData['type'], string> = {
  article: 'article',
  chapter: 'incollection',
  book: 'book',
  thesis: 'phdthesis',
  preprint: 'misc',
  abstract: 'inproceedings',
};

const tex = (s: string) => s.replace(/\*([^*]+)\*/g, '\\textit{$1}').replace(/&/g, '\\&').replace(/–/g, '--');

export function bibtex(p: Pub): string {
  const d = p.data;
  const fields: [string, string | number | undefined][] = [
    ['author', d.authors.join(' and ')],
    ['title', `{${tex(d.title)}}`],
    ['journal', d.type === 'article' || d.type === 'preprint' ? d.journal : undefined],
    ['booktitle', d.type === 'chapter' ? d.book : d.type === 'abstract' ? (d.venue ?? d.journal) : undefined],
    ['school', d.school],
    ['publisher', d.publisher],
    ['volume', d.volume],
    ['number', d.issue],
    ['pages', d.pages?.replace(/\s*[–-]+\s*/g, '--')],
    ['year', d.year],
    ['doi', d.doi],
    ['url', d.doi ? undefined : d.url],
    ['note', d.type === 'abstract' ? 'Conference abstract' : undefined],
  ];
  const body = fields
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `  ${k.padEnd(9)} = {${v}}`)
    .join(',\n');
  return `@${BIB_TYPE[d.type]}{${p.id},\n${body}\n}`;
}

// ── Dates (news) ──────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-05" → "May 2026"; "2020" → "2020". */
export function looseDateLabel(d: string) {
  const [y, m] = d.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y!;
}
