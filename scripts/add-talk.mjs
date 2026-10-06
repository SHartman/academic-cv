#!/usr/bin/env node
/**
 * Add a conference talk or poster (no DOI needed) by answering a few questions.
 *
 *   npm run add-talk
 *
 * Writes a correctly formatted entry to the top of src/data/publications.yaml,
 * and optionally a News item. Press Enter to skip any optional question.
 */
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { PUBS, NEWS, SITE, THEMES, entryBlock, makeId, newsBlock, prepend, readYaml } from './lib.mjs';

// A small line queue rather than readline/promises, so answers can also be piped in.
const rl = createInterface({ input: stdin, terminal: Boolean(stdin.isTTY) });
const queue = [];
let waiting = null;
let ended = false;
rl.on('line', (line) => (waiting ? (waiting(line), (waiting = null)) : queue.push(line)));
rl.on('close', () => {
  ended = true;
  if (waiting) waiting(null), (waiting = null);
});
const nextLine = () =>
  queue.length ? Promise.resolve(queue.shift()) : ended ? Promise.resolve(null) : new Promise((r) => (waiting = r));

async function ask(q, def = '') {
  stdout.write(def ? `${q} [${def}]: ` : `${q}: `);
  const line = await nextLine();
  if (line === null) {
    console.log('\nInput ended before all questions were answered. Nothing written.');
    process.exit(1);
  }
  if (!stdin.isTTY) stdout.write(`${line}\n`);
  return line.trim() || def;
}

async function askUntil(q, ok, hint, def) {
  for (;;) {
    const a = await ask(q, def);
    if (ok(a)) return a;
    console.log(`  ↳ ${hint}`);
  }
}

const site = await readYaml(SITE);
const me = site.self?.citeAs ?? `${site.self.family}, ${site.self.givenInitial}.`;
const existing = (await readYaml(PUBS)) ?? [];
const ids = new Set(existing.map((e) => e.id));

console.log('\nAdd a conference talk or poster. Optional questions can be left blank.\n');

const title = await askUntil('Title (use *asterisks* for italic taxon names)', (a) => a.length > 3, 'A title is required.');
console.log(`\nAuthors in order, separated by semicolons, each as "Family, Given".`);
console.log(`Type "me" for yourself (${me}). Example: Fitch, Adam; me; Pittman, Michael`);
const authors = (
  await askUntil('Authors', (a) => a.split(';').some((s) => s.trim()), 'At least one author is required.')
)
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => (s.toLowerCase() === 'me' ? me : s));
if (!authors.some((a) => a.split(',')[0].trim() === site.self.family)) {
  console.log(`  ↳ Note: you're not in the author list. That's fine if intended.`);
}

const thisYear = String(new Date().getFullYear());
const year = Number(await askUntil('Year', (a) => /^\d{4}$/.test(a), 'Four digits, e.g. 2026.', thisYear));
const monthRaw = await askUntil('Month, 1–12 (optional)', (a) => a === '' || (/^\d{1,2}$/.test(a) && +a >= 1 && +a <= 12), 'A number 1–12, or blank.');
const month = monthRaw ? Number(monthRaw) : undefined;

const meeting = await askUntil('Meeting (e.g. Society of Vertebrate Paleontology 86th Annual Meeting)', (a) => a.length > 2, 'The meeting name is required.');
const place = await ask('Location (optional, e.g. Minneapolis, Minnesota)');
const fmt = (await ask('Talk or poster? (t/p, blank if unsure)')).toLowerCase();
const format = fmt.startsWith('t') ? 'talk' : fmt.startsWith('p') ? 'poster' : undefined;

const journal = await ask('Abstract printed in a journal/supplement? Journal name (optional, e.g. Journal of Vertebrate Paleontology)');
const volume = journal ? await ask('  Volume (optional)') : '';
const pages = journal ? await ask('  Page(s) (optional)') : '';

const themeRaw = await askUntil(
  `Research areas: ${THEMES.join(', ')} (comma-separated, optional)`,
  (a) => a.split(',').map((t) => t.trim()).filter(Boolean).every((t) => THEMES.includes(t)),
  `Use any of: ${THEMES.join(', ')}`,
);
const themes = themeRaw.split(',').map((t) => t.trim()).filter(Boolean);
const url = await askUntil('Link to slides, poster, or abstract (optional)', (a) => a === '' || /^https?:\/\//.test(a), 'Start with https://, or leave blank.');
const abstract = await ask('Abstract text, pasted on one line (optional)');
const wantNews = (await ask('Also post a News item? (y/N)')).toLowerCase().startsWith('y');

const id = makeId(authors[0].split(',')[0], year, title, ids);
const venue = place ? `${meeting}, ${place}` : meeting;
const block = entryBlock([
  ['id', id],
  ['type', 'abstract'],
  ['format', format],
  ['year', year],
  ['month', month],
  ['title', title],
  ['authors', authors],
  ['journal', journal],
  ['venue', venue],
  ['volume', volume],
  ['pages', pages],
  ['url', url],
  ['themes', themes],
  ['abstract', abstract.replace(/\s+/g, ' ')],
]);

console.log(`\n${block}`);
const ok = !(await ask('Add this entry? (Y/n)')).toLowerCase().startsWith('n');
rl.close();
if (!ok) {
  console.log('Nothing written.');
} else {
  await prepend(PUBS, [block], 'id');
  if (wantNews) {
    const kind = format ?? 'presentation';
    const date = month ? `${year}-${String(month).padStart(2, '0')}` : String(year);
    await prepend(NEWS, [newsBlock(date, `Presented a ${kind}, “${title},” at the ${meeting}.`, `/publications/${id}/`)], 'date');
  }
  console.log(`✓ Added "${id}"${wantNews ? ' and a News item' : ''}. Run  npm run dev  to check it.`);
}
