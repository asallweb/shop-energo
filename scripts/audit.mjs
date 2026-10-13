import { mkdir, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import desktop from 'lighthouse/core/config/desktop-config.js';
import { pages } from './pages.mjs';

const { values } = parseArgs({ options: {
  base: { type: 'string', default: 'http://127.0.0.1:4173/shop-energo/' },
  output: { type: 'string', default: '.local/ai/audits' },
  pages: { type: 'string', default: Object.keys(pages).join(',') },
} });
await mkdir(values.output, { recursive: true });
const summary = [];
for (const name of values.pages.split(',')) {
  if (!pages[name]) throw new Error(`Unknown page: ${name}`);
  const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'], chromePath: process.env.CHROME_PATH });
  try {
    const result = await lighthouse(new URL(`${name}.html`, values.base).href, { port: chrome.port, output: ['json', 'html'], onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], logLevel: 'error' }, desktop);
    await writeFile(`${values.output}/${name}.json`, result.report[0]);
    await writeFile(`${values.output}/${name}.html`, result.report[1]);
    const { lhr } = result;
    const entry = { page: name, url: lhr.finalDisplayedUrl, version: lhr.lighthouseVersion, date: lhr.fetchTime, scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(key => [key, lhr.audits[key].numericValue])) };
    summary.push(entry);
    await writeFile(`${values.output}/summary.json`, JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(entry));
  } finally { await chrome.kill(); }
}
