// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { figureCaptions } from './src/lib/figure-plugin.mjs';

export default defineConfig({
  site: 'https://www.scotthartman.info',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    processor: satteri({ hastPlugins: [figureCaptions] }),
  },
});
