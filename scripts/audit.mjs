import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { startPreview } from './preview.mjs';

const routes = process.argv.slice(2);
if (!routes.length) routes.push('/', '/now/', '/work/purdue-rov-cv-runtime/');
const preview = await startPreview(4323);
let browser;
await mkdir('tmp/qa', { recursive: true });
try {
  browser = await chromium.launch({ executablePath: chromium.executablePath(), args: ['--remote-debugging-port=9223'] });
  for (const route of routes) {
    const result = await lighthouse(preview.url + route, {
      port: 9223, logLevel: 'error', output: ['json', 'html'],
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const name = route.replaceAll('/', '-') || 'home';
    await writeFile(`tmp/qa/lighthouse-${name}.json`, result.report[0]);
    await writeFile(`tmp/qa/lighthouse-${name}.html`, result.report[1]);
    console.log(route, Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])));
    console.log('Actionable audits:', Object.values(result.lhr.audits).filter((audit) => audit.score !== null && audit.score < 1 && !['notApplicable', 'informative', 'manual'].includes(audit.scoreDisplayMode)).map((audit) => `${audit.id}: ${audit.title}`));
  }
} finally {
  await browser?.close();
  preview.stop();
}
