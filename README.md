# scotthartman.info

Academic website of Scott Hartman: paleobiologist and vertebrate paleontologist,
Department of Biology, University of Wisconsin–Madison.

Built with [Astro](https://astro.build) and deployed on Cloudflare. Skeletal reconstructions
and paleoart live at the sister site, [skeletaldrawing.com](https://www.skeletaldrawing.com).

**To update content, see [EDITING.md](EDITING.md).**

## Layout

```
src/
  data/
    site.yaml              name, titles, links, section switches
    publications.yaml      every paper / chapter / book / thesis / abstract
    news.yaml              dated news items
  content/
    research/*.md          the three research areas
    pages/about.md         bio and education
    software/*.md          research tools (section off until a tool is public)
  assets/                  images (optimized at build time)
    publications/<id>.*    optional figure for a publication page
  components/              Cladogram, PubTimeline (the range chart), PubItem, …
  pages/                   routes
  lib/                     citation formatting, BibTeX, site settings loader
wrangler.jsonc             Cloudflare deployment config
public/
  cv.pdf                   linked from the nav
  _redirects               old Wowchemy URLs → new pages
scripts/                   add-paper (from a DOI) and add-talk (guided) helpers
```

## Commands

| Command | |
|---|---|
| `npm install` | once per machine |
| `npm run dev` | local preview at http://localhost:4321 |
| `npm run build` | production build into `dist/` |
| `npm run check` | type-check |
| `npm run add-paper -- <DOI>` | add a publication from Crossref |
| `npm run add-talk` | add a talk or poster (guided questions) |

## Deploying (Cloudflare)

The site deploys as a static-assets Worker (config in `wrangler.jsonc`). In the Cloudflare
dashboard: Workers & Pages → Create → import this GitHub repository, then set:

- Project name: **academic-cv** (must match `name` in `wrangler.jsonc`)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (the default)

Node version comes from `.node-version`. Every push to the production branch rebuilds the
site; other branches get preview builds. `npx wrangler dev` serves `dist/` locally exactly
as Cloudflare will, including the redirects in `public/_redirects`.

## Design

"Cladogram": Chivo and Chivo Mono (self-hosted), black ink on white, with the avialan blue
(`#1f4fd8`) and volant-taxon red (`#c62a1f`) taken from the paravian phylogeny figures.
The home-page tree's tips are research areas, and the publication record is drawn as a
time-calibrated range chart (filled = paper, outlined = abstract, blue = selected).
