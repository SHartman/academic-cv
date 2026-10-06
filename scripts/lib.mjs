// Shared helpers for the add-paper / add-talk scripts: writing well-formed YAML
// entries into src/data/*.yaml without disturbing the comments already there.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
export const PUBS = `${root}src/data/publications.yaml`;
export const NEWS = `${root}src/data/news.yaml`;
export const SITE = `${root}src/data/site.yaml`;
export const THEMES = ['flight', 'physiology', 'anatomy'];
export const TYPES = ['article', 'chapter', 'book', 'thesis', 'preprint', 'abstract'];

const STOP = new Set(['a', 'an', 'the', 'on', 'of', 'in', 'and', 'for', 'to', 'from', 'with', 'is', 'are', 'new']);

export const ascii = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** "lastname-year-firstword", unique against `taken`. */
export function makeId(family, year, title, taken) {
  const word = title.replace(/\*/g, '').split(/[\s:,.;()-]+/).map(ascii).find((w) => w && !STOP.has(w)) ?? 'item';
  const base = `${ascii(family)}-${year}-${word}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  taken.add(id);
  return id;
}

/** Quote a YAML scalar only when it would otherwise be misread. */
export function q(v) {
  const s = String(v);
  if (/^\d+$/.test(s)) return s;
  try {
    const back = parse(`k: ${s}`);
    if (back && back.k === s) return s;
  } catch {}
  return JSON.stringify(s);
}

function wrap(text, width = 96, indent = '    ') {
  const out = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > width) {
      out.push(indent + line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(indent + line);
  return out;
}

/** Render [key, value] pairs as one YAML list entry, in the house style. */
export function entryBlock(pairs) {
  const lines = [];
  for (const [k, v] of pairs) {
    if (v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && !v.length)) continue;
    const pre = lines.length ? '  ' : '- ';
    if (k === 'authors') lines.push(`${pre}authors:`, ...v.map((a) => `    - ${q(a)}`));
    else if (k === 'themes') lines.push(`${pre}themes: [${v.join(', ')}]`);
    else if (v === true) lines.push(`${pre}${k}: true`);
    else if (k === 'abstract') lines.push(`${pre}abstract: >-`, ...wrap(v));
    else lines.push(`${pre}${k}: ${q(v)}`);
  }
  return lines.join('\n') + '\n';
}

/** Insert entry blocks before the first list item (newest on top), keeping header comments. */
export async function prepend(file, blocks, firstKey) {
  let text = await readFile(file, 'utf8');
  const at = text.search(new RegExp(`^- ${firstKey}:`, 'm'));
  const chunk = blocks.join('\n') + '\n';
  text = at >= 0 ? text.slice(0, at) + chunk + text.slice(at) : text.trimEnd() + '\n\n' + chunk;
  await writeFile(file, text);
}

export const readYaml = async (file) => parse(await readFile(file, 'utf8'));

export const newsBlock = (date, text, link) => entryBlock([['date', date], ['text', text], ['link', link]]);
