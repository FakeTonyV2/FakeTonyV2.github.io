import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { transformerNotationHighlight } from '@shikijs/transformers';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { site } from './src/config/site.ts';
import { accessibleMarkdown } from './src/lib/markdown.mjs';

export default defineConfig({
  site: site.origin,
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/404/') })],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, rehypeHeadingIds, accessibleMarkdown],
    }),
    shikiConfig: {
      theme: 'github-dark',
      transformers: [transformerNotationHighlight()],
    },
  },
});
