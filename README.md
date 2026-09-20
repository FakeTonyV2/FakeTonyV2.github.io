# Fiyin’s notebook

A static personal website about systems, ML infrastructure, and things built along the way. Built with Astro, TypeScript, Markdown/MDX, and plain CSS. No application framework, database, or browser-side JavaScript is required for the current pages.

## Local development

Use Node **22.22.1** (recorded in `.nvmrc`) and npm **10.8.2 or newer**. Node 24 is also supported. On Windows, either use a native Node installation or run the project entirely in WSL; do not share platform-specific `node_modules` between the two environments.

```sh
npm install
npm run dev
```

Development runs at `http://localhost:4321`. For a reproducible install, use `npm ci` with the committed lockfile.

```sh
npm run check
npm run build
npm test
npm run preview
```

`dist/` contains the deployable site. Build artifacts, dependencies, and local QA screenshots are ignored by Git. Astro can report that the writing collection is empty; this is expected until the first article is added.

## Architecture

```text
.github/workflows/deploy.yml   PR checks and GitHub Pages deployment
astro.config.mjs              Static output, MDX, sitemap, Markdown pipeline
public/                      Résumé, favicon, and social image
scripts/                     Output, content, and browser verification
src/
  components/                Writing lists, page headers, figures, related links
  config/site.ts             Identity, contacts, origin, manual homepage date
  content/
    pages/                   Home, Now, About, and Reading Markdown
    writing/                 Articles; initially empty
  content.config.ts          Typed frontmatter schemas
  layouts/Base.astro         HTML shell, navigation, footer, social/SEO metadata
  lib/                       Content queries and accessible Markdown processing
  pages/                     Static routes, RSS, and robots.txt
  styles/global.css          Design tokens, layouts, typography, responsive styles
templates/                   Unpublished article starting point
```

Astro builds every route to static HTML. Content is read at build time, validated, and rendered through shared layouts. Article filenames determine stable URLs. Shared queries sort writing newest first, verify related references, and exclude drafts everywhere. Equal-date entries sort alphabetically for deterministic output.

The visible design is intentionally plain: one warm, narrow reading column; system serif text; ordinary headings, paragraphs, lists, and underlined links. It follows the spirit of early personal homepages and keeps the supplied biography close to its original wording. There are no font-network requests or browser-side interface scripts. CSS handles mobile navigation, visible keyboard focus, and scrollable code, math, and tables.

## Adding writing

Copy `templates/article.md` into `src/content/writing/a-readable-slug.md` (or `.mdx`). Add the publication date and switch the draft flag when ready:

```yaml
title: An article title
description: The central idea in one sentence.
published: 2026-09-19
# updated: 2026-09-20
type: architecture
draft: false
tags: [systems, inference]
relatedWriting: []
```

The article appears at `/writing/a-readable-slug/`, on Home and Writing, and in RSS and the sitemap. One file is enough. Keep its filename stable after publication. `type` is one of `essay`, `architecture`, `postmortem`, `experiment`, `benchmark`, or `research-note`. These are metadata, not additional navigation categories.

Drafts default to `true`. They have no production route and do not appear in indexes, RSS, navigation, or related links. A non-draft article must have a `published` date; `updated` cannot precede it. Future dates do **not** schedule publication: `draft: false` publishes on the next build. Keep future pieces as drafts until ready.

Use H2/H3 sections for the automatic table of contents; the layout provides H1. Headings receive permalink anchors. Reading time estimates prose at 220 words per minute, excluding fenced code. Previous/next links follow publication order. Empty Related sections are omitted. Related fields contain collection IDs (filenames without extensions); missing references stop the build, while references to existing drafts are hidden.

### Article features

- Use fenced code blocks with a language for Shiki highlighting. Append `// [!code highlight]` to a code line to highlight it; the marker is removed from the displayed code.
- Use ordinary Markdown tables, blockquotes, and footnotes (`[^note]` with a matching definition).
- Use `$...$` for inline math and `$$` blocks for displayed equations. KaTeX renders at build time, with its CSS/fonts loaded only on article pages.
- Add citations as descriptive links, footnotes, or a References section.
- Use SVG diagrams or images; no Mermaid client bundle is loaded.
- For optimized responsive images and captions in MDX, import the `Figure` component and a local image:

```mdx
import Figure from '../../components/Figure.astro';
import diagram from './images/architecture.png';

<Figure src={diagram} alt="Describe the data flow and components" caption="The architecture." />
```

Ordinary Markdown images also work. Local image files are processed by Astro; provide useful alt text. For SVG diagrams in `public/`, use Markdown image syntax with a root-relative URL and descriptive alt text. Complex diagrams should also have an adjacent text explanation.

## Updating Now and other copy

Edit `src/content/pages/now.md`, including its explicit `updated` date. The initial content follows the September 19, 2026 snapshot. The homepage biography and its own update date live in `src/content/pages/home.md`; this keeps the primary page easy to edit as plain Markdown and preserves the original prose.

About and Reading are Markdown files beside Home and Now. Finished and Recommended remain empty until actual entries are supplied. The Writing empty-state string and all identity/contact metadata live in `src/config/site.ts`.

Replace `public/resume.pdf` to update the résumé without breaking links. The initial file is an unchanged copy of the supplied PDF. Contact links use the email, GitHub, and LinkedIn URLs embedded in that résumé. Its phone number is not separately reproduced in site copy.

## Dependencies

Versions are pinned in `package.json` and `package-lock.json`.

| Package | Purpose |
| --- | --- |
| `astro` | Static routing, layouts, content collections, optimized images, built-in Shiki |
| `@astrojs/mdx` | MDX content with Astro components |
| `@astrojs/markdown-remark` | Unified Markdown processor for remark/rehype plugins in Astro 7 |
| `@astrojs/rss` | Valid RSS generation, including an empty feed |
| `@astrojs/sitemap` | Build-time sitemap generation |
| `@shikijs/transformers` | Highlighted code lines using notation comments |
| `remark-math`, `rehype-katex`, `katex` | Parse math, render it statically, supply article styles/fonts |
| `typescript`, `@astrojs/check`, `@types/node` | Development-only type checks |
| `cheerio` | Development-only generated HTML/XML verification |
| `@playwright/test`, `@axe-core/playwright` | Development-only browser and accessibility checks |
| `lighthouse` | Development-only performance, accessibility, and SEO auditing |

## Verification

`npm test` checks generated routes, internal links and anchors, canonical/social metadata, unique IDs, image alt attributes, RSS, sitemap, robots.txt, the résumé, and the custom 404. Run the build first.

`npm run test:content` creates temporary Markdown/MDX fixtures, checks rich article rendering and publication ordering, tests draft exclusion and invalid metadata/references, then removes only its fixtures and rebuilds the clean site in a `finally` block. It refuses to overwrite existing fixture paths. Do not run it concurrently with the development server, a build, or another content test.

```sh
npx playwright install chromium
npm run test:content -- --browser
npm run test:browser
```

On a clean Linux machine, browser system libraries may also be needed (`npx playwright install --with-deps chromium`). Browser checks start and stop a local production preview, inspect all pages at 360/768/1440px, run axe, verify the skip link, check loaded images and overflow, and check 200% equivalent zoom reflow. Screenshots are written to ignored `tmp/qa/`. Content tests with `--browser` also inspect article fixtures before cleanup.

Run `npm run audit` for mobile Lighthouse reports on Home, Now, and Writing, or `npm run audit -- /writing/your-slug/` to audit an article. Reports are saved in ignored `tmp/qa/`. The audit starts and stops its own production preview. There is no analytics or monitoring service attached.

## GitHub Pages deployment

The site targets **https://faketonyv2.github.io**, with no repository-path prefix. The included workflow validates pull requests and deploys successful pushes to `main` or manual workflow runs on `main`. It runs `npm ci`, type checks, the content regression suite, and generated-output checks before uploading the Pages artifact. Pull requests do not deploy.

To publish, set the repository’s **Settings → Pages → Build and deployment → Source** to **GitHub Actions**, then push the reviewed implementation to `main`. The workflow uses GitHub’s temporary token with deployment permissions only on the deploy job; no stored deployment secret is needed. Implementation alone does not push or change the live site.

The old Jekyll `_config.yml` is removed. Pages serves the uploaded Astro output directly. A custom `404.html` handles unknown URLs.

Reference: [Astro’s GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/), [GitHub’s Pages artifact action](https://github.com/actions/upload-pages-artifact), and [Pages deployment action](https://github.com/actions/deploy-pages).

### Later: fiyin.dev

1. Configure and verify the domain in GitHub Pages and point its DNS to GitHub Pages using GitHub’s current domain instructions.
2. Change only `site.origin` in `src/config/site.ts` to `https://fiyin.dev`.
3. Add `public/CNAME` containing `fiyin.dev`, configure the Pages custom-domain setting, and enable HTTPS when available.
4. Rebuild and deploy. Check canonical/social URLs, RSS, sitemap, robots.txt, and HTTPS at the new origin.

No CNAME or custom-domain activation ships initially. All absolute URLs derive from the central origin.

## Remaining content TODOs

- Write the first articles, architecture notes, and experiment results; no sample articles are published.
- Record the exact TSA evaluation period before expanding its results section.
- Add finished books and recommendations as desired.
- Activate GitHub Pages when ready to publish; configure `fiyin.dev` later.

Potential future improvements: static Mermaid rendering when diagrams justify it and a searchable archive when enough writing exists. Keep the initial site small until those needs arise.
