import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { load } from 'cheerio';

const root = resolve('dist');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(resolve(dir, entry.name)) : resolve(dir, entry.name)))).flat();
}
const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const documents = new Map(await Promise.all(htmlFiles.map(async (file) => [file, load(await readFile(file, 'utf8'))])));
const home = documents.get(resolve(root, 'index.html'));
const origin = new URL(home('link[rel="canonical"]').attr('href')).origin;
let checkedLinks = 0;
for (const [file, $] of documents) {
  const path = '/' + relative(root, file).replaceAll('\\', '/').replace(/index\.html$/, '');
  const url = new URL(path, origin);
  assert.equal($('h1').length, 1, `${path}: exactly one h1`);
  assert.equal($('main').length, 1, `${path}: main landmark`);
  assert.equal($('html').attr('lang'), 'en');
  assert.ok($('title').text().length > 0, `${path}: title`);
  assert.ok($('meta[name="description"]').attr('content'), `${path}: description`);
  assert.equal($('link[rel="canonical"]').attr('href'), url.href, `${path}: canonical`);
  assert.equal($('meta[property="og:url"]').attr('content'), url.href);
  const ids = new Set();
  $('[id]').each((_, node) => {
    const id = $(node).attr('id');
    assert.ok(!ids.has(id), `${path}: duplicate id ${id}`);
    ids.add(id);
  });
  $('img').each((_, node) => assert.ok($(node).attr('alt') !== undefined, `${path}: image missing alt`));
  const references = [];
  $('a[href], link[href], img[src], script[src], meta[property="og:image"]').each((_, node) => {
    references.push($(node).attr('href') ?? $(node).attr('src') ?? $(node).attr('content'));
  });
  for (const ref of references) {
    const target = new URL(ref, url);
    if (target.origin !== origin || !['http:', 'https:'].includes(target.protocol)) continue;
    let local = resolve(root, '.' + decodeURIComponent(target.pathname));
    assert.ok(local.startsWith(root), `${path}: path outside output`);
    const info = await stat(local).catch(() => null);
    if (info?.isDirectory()) local = resolve(local, 'index.html');
    else if (!info && !extname(local)) local = resolve(local, 'index.html');
    assert.ok(files.includes(local), `${path}: missing local target ${ref}`);
    if (target.hash && documents.has(local)) {
      const id = decodeURIComponent(target.hash.slice(1));
      assert.ok(documents.get(local)(`[id]`).toArray().some((node) => node.attribs.id === id), `${path}: missing anchor ${ref}`);
    }
    checkedLinks++;
  }
}
const feed = load(await readFile(resolve(root, 'rss.xml'), 'utf8'), { xmlMode: true });
assert.equal(feed('rss channel').length, 1, 'valid RSS structure');
assert.equal(new URL(feed('channel > link').text()).origin, origin);
const index = load(await readFile(resolve(root, 'sitemap-index.xml'), 'utf8'), { xmlMode: true });
const locations = [];
for (const node of index('loc').toArray()) {
  const sitemap = new URL(index(node).text());
  assert.equal(sitemap.origin, origin);
  const xml = load(await readFile(resolve(root, '.' + sitemap.pathname), 'utf8'), { xmlMode: true });
  locations.push(...xml('loc').toArray().map((loc) => xml(loc).text()));
}
for (const route of ['/', '/work/', '/writing/', '/now/', '/about/', '/reading/']) {
  assert.ok(locations.includes(new URL(route, origin).href), `sitemap missing ${route}`);
}
assert.ok(!locations.some((url) => /\/404(?:[/.]|$)/.test(url)), '404 excluded from sitemap');
for (const location of locations) {
  const url = new URL(location);
  assert.equal(url.origin, origin);
  assert.ok(documents.has(resolve(root, '.' + url.pathname, 'index.html')), `sitemap target exists: ${url.pathname}`);
}
const robots = await readFile(resolve(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`));
assert.equal((await readFile(resolve(root, 'resume.pdf'))).subarray(0, 5).toString(), '%PDF-');
assert.ok((await stat(resolve(root, 'social.png'))).size > 1000);
assert.ok(documents.get(resolve(root, '404.html'))('meta[name="robots"]').attr('content').includes('noindex'));
console.log(`Output checks passed: ${htmlFiles.length} pages, ${checkedLinks} internal references, ${feed('item').length} RSS entries, ${locations.length} sitemap URLs.`);
