#!/usr/bin/env node
/**
 * Add a publication to src/data/publications.yaml from its DOI, using Crossref.
 *
 *   npm run add-paper -- 10.7717/peerj.7247
 *   npm run add-paper -- https://doi.org/10.1073/pnas.2205476119 --selected --theme flight --news
 *
 * Options
 *   --selected          feature it under "Selected publications" on the home page
 *   --theme a,b         research areas: flight, physiology, anatomy
 *   --news              also add a News item announcing it
 *   --type abstract     override the type Crossref reports (e.g. a meeting abstract
 *                       published in a journal supplement, like FASEB J or GSA)
 *   --venue "…"         the meeting name, for --type abstract
 *   --dry-run           print what would be added, change nothing
 *
 * The entry goes at the top of the list (comments elsewhere are untouched).
 * Review it afterwards: Crossref is usually right, but not always.
 */
import { PUBS, NEWS, SITE, THEMES, TYPES, entryBlock, makeId, newsBlock, prepend, readYaml } from './lib.mjs';

// ── arguments ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const VALUED = new Set(['--theme', '--type', '--venue']);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const dois = args
  .filter((a, i) => !a.startsWith('--') && !VALUED.has(args[i - 1]))
  .map((a) => a.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, ''));

function usage(code) {
  console.log('Usage: npm run add-paper -- <DOI> [more DOIs] [--selected] [--theme flight,anatomy] [--news]');
  console.log('                                  [--type abstract --venue "Meeting name"] [--dry-run]');
  process.exit(code); // safe: no network handles open yet
}
if (!dois.length || flag('help')) usage(dois.length ? 0 : 1);

const themes = (opt('theme') ?? '').split(',').map((t) => t.trim()).filter(Boolean);
const badTheme = themes.find((t) => !THEMES.includes(t));
const typeOverride = opt('type');
if (badTheme || (typeOverride && !TYPES.includes(typeOverride))) {
  console.error(badTheme ? `\n✗ Unknown theme "${badTheme}". Use any of: ${THEMES.join(', ')}\n` : `\n✗ Unknown type "${typeOverride}". Use one of: ${TYPES.join(', ')}\n`);
  process.exit(1);
}

class Fail extends Error {}
const fail = (msg) => {
  throw new Fail(msg);
};

// ── Crossref ─────────────────────────────────────────────────────────────────
const decode = (s) =>
  s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

/** Crossref JATS/HTML → our Markdown-lite: italics become *asterisks*. */
const clean = (s = '') =>
  decode(
    s
      .replace(/<(jats:)?(italic|i|em)>\s*/gi, '*').replace(/\s*<\/(jats:)?(italic|i|em)>/gi, '*')
      .replace(/<(jats:)?title>.*?<\/(jats:)?title>/gis, '') // "Abstract" headings
      .replace(/<\/(jats:)?p>\s*<(jats:)?p[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .replace(/\*\s+(?=[-–,.;:)])/g, '*')
    .trim();

const TYPE = {
  'journal-article': 'article',
  'book-chapter': 'chapter',
  'book-section': 'chapter',
  book: 'book',
  monograph: 'book',
  'edited-book': 'book',
  dissertation: 'thesis',
  'posted-content': 'preprint',
  'proceedings-article': 'abstract',
};

async function crossref(doi, email) {
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': `scotthartman.info add-paper (mailto:${email})` },
  });
  if (res.status === 404) fail(`Crossref doesn't know DOI ${doi}. Check it, or add the entry by hand (npm run add-talk for presentations).`);
  if (!res.ok) fail(`Crossref returned ${res.status} for ${doi}. Try again in a minute.`);
  return (await res.json()).message;
}

// ── main ─────────────────────────────────────────────────────────────────────
// (Returns rather than calling process.exit(): on Windows, exiting while fetch's
// sockets are still closing crashes Node.)
async function main() {
  const site = await readYaml(SITE);
  const existing = (await readYaml(PUBS)) ?? [];
  const ids = new Set(existing.map((e) => e.id));
  const known = new Map(existing.filter((e) => e.doi).map((e) => [String(e.doi).toLowerCase(), e.id]));
  const blocks = [];
  const news = [];

  for (const doi of dois) {
    if (known.has(doi.toLowerCase())) {
      console.log(`• ${doi} is already listed as "${known.get(doi.toLowerCase())}". Skipping.`);
      continue;
    }
    const m = await crossref(doi, site.email);
    const type = typeOverride ?? TYPE[m.type] ?? 'article';
    const title = clean(m.title?.[0] ?? '');
    if (!title) fail(`Crossref has no title for ${doi}.`);
    // Crossref occasionally lists every author twice (some GSA abstracts); de-duplicate.
    const authors = [
      ...new Set(
        (m.author ?? [])
          .filter((a) => a.family || a.name)
          .map((a) => (a.family ? (a.given ? `${a.family.trim()}, ${a.given.trim()}` : a.family.trim()) : a.name.trim())),
      ),
    ];
    if (!authors.length) fail(`Crossref has no authors for ${doi}; add this one by hand.`);
    const [year, month] = (m['published-print'] ?? m.published ?? m.issued)?.['date-parts']?.[0] ?? [];
    if (!year) fail(`Crossref has no publication date for ${doi}.`);

    const id = makeId(authors[0].split(',')[0], year, title, ids);
    const container = clean(m['container-title']?.[0] ?? '');
    blocks.push(
      entryBlock([
        ['id', id],
        ['type', type],
        ['year', year],
        ['month', month],
        ['title', title],
        ['authors', authors],
        [type === 'chapter' ? 'book' : 'journal', container || undefined],
        ['venue', opt('venue')],
        ['publisher', type === 'book' || type === 'chapter' ? m.publisher : undefined],
        ['volume', m.volume],
        ['issue', m.issue],
        ['pages', (m.page ?? m['article-number'])?.replace(/-/g, '–')],
        ['doi', m.DOI ?? doi],
        ['themes', themes],
        ['selected', flag('selected')],
        ['abstract', m.abstract ? clean(m.abstract) : undefined],
      ]),
    );
    known.set(doi.toLowerCase(), id);

    console.log(`\n✓ ${id}\n  ${title.replace(/\*/g, '')}\n  ${authors.length} authors · ${container || type} · ${year}`);
    if (!themes.length) console.log('  (no --theme given: it won’t appear on a research-area page)');
    if (type === 'abstract' && !opt('venue')) console.log('  (tip: add --venue "Meeting name" for abstracts)');
    if (flag('news')) {
      const where = container ? `New paper in *${container}*` : 'New publication';
      news.push(newsBlock(`${year}-${String(month ?? 1).padStart(2, '0')}`, `${where}, “${title}”`, `/publications/${id}/`));
    }
  }

  if (!blocks.length) return;
  if (flag('dry-run')) {
    console.log('\n--dry-run: nothing written. Entries:\n');
    console.log(blocks.join('\n'));
    return;
  }
  await prepend(PUBS, blocks, 'id');
  if (news.length) await prepend(NEWS, news, 'date');

  console.log(`
Added ${blocks.length} to src/data/publications.yaml${news.length ? ' and News to src/data/news.yaml' : ''}.
Next (all optional):
  • glance over the entry — Crossref sometimes has typos or Title Case
  • add pdf: <link> if there's a free PDF
  • drop a figure named <id>.jpg or .png into src/assets/publications/ and add a caption:
  • run  npm run dev  to check it, then commit and push to publish
`);
}

main().catch((err) => {
  console.error(err instanceof Fail ? `\n✗ ${err.message}\n` : err);
  process.exitCode = 1;
});
