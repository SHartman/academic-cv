import { getCollection } from 'astro:content';
import { site } from './site';

/**
 * Tools that may appear on the site: none at all unless `features.software`
 * is on in site.yaml, and then only those marked `visible: true`.
 */
export async function visibleTools() {
  if (!site.features.software) return [];
  return (await getCollection('software', (t) => t.data.visible)).sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name),
  );
}
