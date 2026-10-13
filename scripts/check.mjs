import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pages } from './pages.mjs';

const output = resolve('dist');
let checks = 0;
for (const name of Object.keys(pages)) {
  const html = await readFile(resolve(output, `${name}.html`), 'utf8');
  if (html.includes('<!-- include:') || html.includes('{{')) throw new Error(`${name}: unresolved template`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) throw new Error(`${name}: duplicate id`);
  for (const match of html.matchAll(/\b(?:src|href)="([^"#]+)(?:#([^"]*))?"/g)) {
    const url = match[1].split(/[?#]/)[0];
    if (/^(?:https?:|tel:|mailto:)/.test(url)) continue;
    const target = resolve(output, url);
    if (!(await stat(target)).isFile()) throw new Error(`${name}: missing ${url}`);
    if (match[2] && url.endsWith('.html')) {
      const linked = await readFile(target, 'utf8');
      if (!linked.includes(`id="${match[2]}"`)) throw new Error(`${name}: missing ${url}#${match[2]}`);
    }
    checks++;
  }
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
    if (!ids.includes(match[1])) throw new Error(`${name}: missing anchor ${match[1]}`);
    checks++;
  }
  if (!/<meta name="description" content="[^"]+">/.test(html)) throw new Error(`${name}: missing description`);
}
async function checkBundles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { await checkBundles(file); continue; }
    if (!/\.(css|js)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    const references = file.endsWith('.css')
      ? [...text.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
      : [...text.matchAll(/(?:from|import\()?\s*["'](\.\.?\/[^"']+\.js)["']/g)];
    for (const match of references) {
      if (/^(?:data:|https?:|#)/.test(match[1])) continue;
      if (!(await stat(resolve(dirname(file), match[1].split(/[?#]/)[0]))).isFile()) throw new Error(`${file}: missing ${match[1]}`);
      checks++;
    }
  }
}
await checkBundles(output);
console.log(`${Object.keys(pages).length} pages, ${checks} local paths and anchors checked`);
