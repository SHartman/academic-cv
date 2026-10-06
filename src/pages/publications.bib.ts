import type { APIRoute } from 'astro';
import { allPubs, bibtex } from '../lib/pubs';

export const GET: APIRoute = async () => {
  const pubs = await allPubs();
  const body = `% Publications of Scott Hartman: https://www.scotthartman.info/publications/\n\n${pubs.map(bibtex).join('\n\n')}\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/x-bibtex; charset=utf-8' } });
};
