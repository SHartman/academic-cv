import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../lib/site';
import { inline } from '../../lib/pubs';

export const GET: APIRoute = async (context) => {
  const news = (await getCollection('news')).sort((a, b) => b.data.date.localeCompare(a.data.date));
  return rss({
    title: `${site.name} · News`,
    description: `New papers, talks, and releases from ${site.name}.`,
    site: context.site!,
    items: news.map((n) => {
      const [y, m = '01', d = '01'] = n.data.date.split('-');
      const text = n.data.text.replace(/\*([^*]+)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      return {
        title: text.length > 90 ? `${text.slice(0, 88).replace(/\s\S*$/, '')}…` : text,
        description: inline(n.data.text),
        pubDate: new Date(`${y}-${m}-${d}T12:00:00Z`),
        link: n.data.link ?? `/news/#${n.id}`,
      };
    }),
  });
};
