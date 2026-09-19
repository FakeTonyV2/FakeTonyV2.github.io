import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startPreview } from './preview.mjs';

const fixture = process.argv.includes('--fixture');
const routes = fixture ? ['/writing/qa-newer/', '/writing/qa-older/'] : [
  '/', '/work/', '/work/heterogeneous-llm-inference/', '/work/purdue-rov-cv-runtime/',
  '/work/tsa-passenger-forecasting/', '/writing/', '/now/', '/about/', '/reading/', '/404.html',
];
const preview = await startPreview();
let browser;
await mkdir('tmp/qa', { recursive: true });
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(preview.url + route);
      assert.ok(response.ok() || route === '/404.html', `${route} responds successfully`);
      await page.waitForLoadState('networkidle');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: no page overflow at ${width}px`);
      const broken = await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
      assert.deepEqual(broken, [], `${route}: images load`);
      await page.screenshot({ path: `tmp/qa/${route.replaceAll('/', '-').replaceAll('.', '-') || 'home'}-${width}.png`, fullPage: true });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
      assert.deepEqual(axe.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })), [], `${route}: accessibility at ${width}px`);
    }
  }
  await page.goto(preview.url + routes[0]);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
  // A 720px effective viewport represents a 1440px desktop at 200% browser zoom.
  await page.setViewportSize({ width: 720, height: 500 });
  for (const route of routes) {
    await page.goto(preview.url + route);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: reflows at 200% equivalent zoom`);
  }
  if (!fixture) {
    await page.goto(preview.url + '/now/');
    assert.equal(await page.locator('h1').textContent(), '/now');
    const nowDate = await page.locator('.now-date time').getAttribute('datetime');
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(nowDate));
    assert.equal(await page.locator('.now-date').textContent(), `Last updated ${formattedDate}`);
    for (const route of ['/', '/writing/']) {
      await page.goto(preview.url + route);
      if (await page.locator('.empty-state').count()) {
        assert.equal(await page.locator('.empty-state').textContent(), "Nothing here yet. I'm working on the first few pieces.");
      }
    }
    const missing = await page.goto(preview.url + '/a-coordinate-that-does-not-exist/');
    assert.equal(missing.status(), 404);
    assert.match(await page.locator('h1').textContent(), /This coordinate/);
  }
  assert.deepEqual(errors, [], 'no browser exceptions');
  console.log(`Browser checks passed: ${routes.length} routes at 360, 768, and 1440px; axe, keyboard navigation, image loading, and zoom reflow.`);
} finally {
  await browser?.close();
  preview.stop();
}
