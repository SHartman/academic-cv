# Editing the site: cheat sheet

Everything you'd normally change is a plain text file in `src/data/` or `src/content/`.
Edit, check it locally if you like, then commit and push: Cloudflare rebuilds the live
site in about a minute. If you mistype something, the build stops and names the file
and field, and the live site stays as it was.

| I want to… | Edit |
|---|---|
| Add a paper | `npm run add-paper -- <DOI>` (see below) |
| Add a talk or poster | `npm run add-talk` (asks you questions) |
| Add anything else without a DOI | copy an entry in `src/data/publications.yaml` |
| Feature a paper on the home page | `selected: true` on its entry |
| Post news | `src/data/news.yaml` |
| Change my title, links, or home-page statement | `src/data/site.yaml` |
| Update the bio / education | `src/content/pages/about.md` |
| Add or edit a course | `src/data/courses.yaml` |
| Edit the teaching intro | `src/content/pages/teaching.md` |
| Add teaching projects or awards | `src/content/pages/teaching-record.md` |
| Rewrite a research area | `src/content/research/<flight\|physiology\|anatomy>.md` |
| Replace the CV | overwrite `public/cv.pdf` |
| Add a figure to a paper's page | drop `<id>.jpg` or `.png` into `src/assets/publications/`, add `caption:` |
| Publish a software tool | see "Software" below |

## One-time setup (per computer)

Install [Node.js](https://nodejs.org) (version 22 or newer), then in this folder:

```bash
npm install
```

## Preview locally

```bash
npm run dev
```

Open <http://localhost:4321>. Pages refresh as you save. `Ctrl+C` stops it.

## Adding a paper

```bash
npm run add-paper -- 10.7717/peerj.7247
```

This looks the DOI up on Crossref and adds a complete entry (authors, journal, volume,
pages, abstract) to the top of `src/data/publications.yaml`. Useful extras:

```bash
npm run add-paper -- 10.7717/peerj.7247 --selected --theme flight,anatomy --news
```

- `--selected` puts it under "Selected publications" on the home page
- `--theme` files it under research areas: `flight`, `physiology`, `anatomy`
- `--news` also writes a News item (worth rewording into a sentence of your own)
- `--dry-run` shows what it would add without changing anything

Afterwards, glance at the entry. Crossref sometimes uses Title Case, or omits a
middle initial. Add `pdf: <link>` if there's a free copy.

**A meeting abstract that does have a DOI** (e.g. *FASEB J*, GSA): add
`--type abstract --venue "Meeting name"` so it's listed as a presentation.

## Adding a talk or poster

```bash
npm run add-talk
```

It asks for the title, authors (type `me` for yourself), year, meeting, talk or
poster, and so on, then shows you the entry before saving it. Press Enter to skip
any optional question.

**Anything else without a DOI** (older chapters, reports) Copy an existing entry of the
same `type` and edit it. The field list is at the top of `publications.yaml`. Use
`*asterisks*` for italic taxon names in titles.

## Research-area figures with captions

In the research Markdown files, a figure with a caption is written as:

```markdown
![Alt text describing the image](../../assets/research/my-figure.jpg "Caption, *italics* allowed.")
```

Put the image in `src/assets/research/`. Images are resized and compressed for you.

## Software

The Software section is built but switched off, so nothing about unreleased tools
appears on the site. When a tool goes public:

1. Copy `src/content/software/_template.md` to e.g. `src/content/software/mytool.md`
   and fill it in, with `visible: true`.
2. In `src/data/site.yaml`, set `features.software: true` (first tool only).

That adds a Software page, a nav link, a home-page section, and a blue "Research
software" branch on the home-page cladogram.

⚠️ This repository is public on GitHub. **Don't commit a tool's file before the
tool's own repository is public**, even with `visible: false`.

## Publishing

```bash
git add -A
git commit -m "Add Smith et al. 2027"
git push
```

Or use GitHub Desktop / VS Code's Source Control panel. You can also edit a file
directly on github.com (pencil icon) and commit there. It deploys the same way.

## Before pushing a big change

```bash
npm run build
```

If it finishes with "Complete!", it will deploy fine.
