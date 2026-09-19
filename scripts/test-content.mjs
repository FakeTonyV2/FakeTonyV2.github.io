import assert from 'node:assert/strict';
import { writeFile, readFile, unlink, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';

// Fixtures are temporary and never part of the published site. Refuse to overwrite anything.
const files = ['src/content/writing/qa-older.md', 'src/content/writing/qa-newer.mdx', 'src/content/writing/qa-secret-draft.md'];
for (const file of files) assert.equal(await access(file).then(() => true).catch(() => false), false, `Fixture path already exists: ${file}`);
function command(args, success = true) {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const output = result.stdout + result.stderr;
  if (success) assert.equal(result.status, 0, output);
  else assert.notEqual(result.status, 0, 'Expected content validation to reject the build');
  return output;
}
const build = () => command(['node_modules/astro/bin/astro.mjs', 'build']);
const header = (title, date, extra = '') => `---\ntitle: ${title}\ndescription: Temporary verification content.\npublished: ${date}\ntype: experiment\ndraft: false\ntags: [testing]\n${extra}---\n\n`;
const body = [
  '## A long heading about heterogeneous inference and the details that matter when runtimes coordinate multiple accelerators',
  '', 'A footnote with context.[^context] Here is inline math: $x^2 + y^2$.', '',
  '### Code example', '', '```ts', 'const runtime = "ready"; // [!code highlight]', 'const description = "A deliberately long code line verifies that code scrolls inside its own region without widening the article or hiding the navigation.";', 'console.log(runtime);', '```', '',
  '## Results', '', '| Accelerator | Description | Queue configuration | Synchronization strategy | Memory layout |', '| --- | --- | --- | --- | --- |', '| GPU | Verification | FixedSizeVerificationQueue | ExplicitSynchronizationBoundary | ContiguousBuffers |', '| NPU | Drafting | IndependentDraftingQueue | CandidateTokenHandoff | DeviceLocalBuffers |', '',
  '> A quoted observation.', '', '$$', 'L = \\frac{T}{N}', '$$', '',
  '## References', '', '[^context]: A verification footnote, not a published claim.', '',
].join('\n');
try {
  await writeFile(files[0], header('QA older article', '2026-09-18') + body);
  await writeFile(files[1], header('QA newer article', '2026-09-19', 'updated: 2026-09-19\nrelatedWork: [heterogeneous-llm-inference]\nrelatedWriting: [qa-older, qa-secret-draft]\n') +
    'import Figure from "../../components/Figure.astro";\nimport cover from "../../../public/social.png";\n\n' + body + '\n<Figure src={cover} alt="Typography on a dark notebook cover" caption="An MDX figure fixture." />\n\n<div>MDX component content works.</div>\n');
  await writeFile(files[2], '---\ntitle: SECRET DRAFT TITLE\ndescription: Must never ship.\ntype: research-note\ndraft: true\n---\n\nSecret draft body.\n');
  build();
  command(['scripts/check-output.mjs']);
  const newer = load(await readFile('dist/writing/qa-newer/index.html', 'utf8'));
  assert.ok(newer('.toc a').length >= 4, 'automatic TOC');
  assert.ok(newer('.heading-anchor').length >= 4, 'heading anchors');
  assert.ok(newer('.footnotes').length, 'footnotes');
  assert.ok(newer('.katex').length >= 2, 'inline and display math');
  assert.ok(newer('pre .line.highlighted').length, 'highlighted code line');
  assert.ok(newer('.table-scroll table').length, 'scrollable table');
  assert.ok(newer('figure img[alt][width][height][srcset]').length, 'responsive MDX figure');
  assert.match(newer('main').text(), /MDX component content works/);
  assert.ok(newer('.related a[href="/work/heterogeneous-llm-inference/"]').length, 'related project');
  assert.ok(newer('.article-pagination a[href="/writing/qa-older/"]').length, 'older navigation');
  assert.ok(!newer('a[href*="qa-secret-draft"]').length, 'draft hidden from related links');
  const older = load(await readFile('dist/writing/qa-older/index.html', 'utf8'));
  assert.ok(older('.article-pagination a[href="/writing/qa-newer/"]').length, 'newer navigation');
  assert.ok(older('.heading-anchor').length && older('.katex').length && older('.footnotes').length, 'Markdown supports same features as MDX');
  const feedText = await readFile('dist/rss.xml', 'utf8');
  const feed = load(feedText, { xmlMode: true });
  assert.deepEqual(feed('item title').toArray().map((node) => feed(node).text()), ['QA newer article', 'QA older article']);
  for (const file of ['dist/index.html', 'dist/writing/index.html', 'dist/rss.xml', 'dist/sitemap-0.xml']) {
    assert.ok(!(await readFile(file, 'utf8')).includes('SECRET DRAFT TITLE'), `${file}: no draft title`);
    assert.ok(!(await readFile(file, 'utf8')).includes('qa-secret-draft'), `${file}: no draft route`);
  }
  assert.equal(await access('dist/writing/qa-secret-draft/index.html').then(() => true).catch(() => false), false);
  if (process.argv.includes('--browser')) command(['scripts/check-browser.mjs', '--fixture']);
  await writeFile(files[0], header('QA broken reference', '2026-09-18', 'relatedWork: [does-not-exist]\n'));
  assert.match(command(['node_modules/astro/bin/astro.mjs', 'build'], false), /unresolved related work entry/);
  await writeFile(files[0], '---\ntitle: Missing date\ndescription: Rejected.\ntype: essay\ndraft: false\n---\n');
  assert.match(command(['node_modules/astro/bin/astro.mjs', 'build'], false), /published date/);
  console.log('Content checks passed: Markdown/MDX rendering, ordering, references, RSS, metadata validation, and draft exclusion.');
} catch (error) {
  console.error(error);
  throw error;
} finally {
  for (const file of files) await unlink(file).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  build();
  command(['scripts/check-output.mjs']);
  console.log('Fixtures removed; clean production site rebuilt and verified.');
}
