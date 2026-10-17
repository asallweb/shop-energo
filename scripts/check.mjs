import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parse as parseJavaScript } from 'acorn';
import postcss from 'postcss';
import { pages } from './pages.mjs';

const output = resolve('dist');
const pageNames = [...Object.keys(pages), 'pages'];
let checks = 0;
function checkCode(text, file) {
  if (/\.(?:js|mjs)$/.test(file)) {
    const comments = [];
    parseJavaScript(text, { ecmaVersion: 'latest', sourceType: 'module', onComment: comments });
    if (comments.length) throw new Error(`${file}: JavaScript comment`);
  } else if (file.endsWith('.css')) {
    postcss.parse(text, { from: file }).walkComments(() => { throw new Error(`${file}: CSS comment`); });
  }
}
for (const name of pageNames) {
  const html = await readFile(resolve(output, `${name}.html`), 'utf8');
  if (html.includes('data-include=') || html.includes('{{')) throw new Error(`${name}: unresolved template`);
  if (html.includes('<!--')) throw new Error(`${name}: HTML comment`);
  const publicationPanels = [...html.matchAll(/<div class="news__list" role="tabpanel"[^>]*>([\s\S]*?)(?=<div class="news__list" role="tabpanel"|<\/section>)/g)];
  const mobileTitles = publicationPanels.map(panel => [...panel[1].matchAll(/<span class="news__mobile-title">([^<]+)<\/span>/g)].map(title => title[1]).join('\n'));
  if (publicationPanels.length && (mobileTitles.some(titles => !titles) || new Set(mobileTitles).size !== publicationPanels.length)) throw new Error(`${name}: publication tabs must have distinct mobile content`);
  if (name !== 'pages') {
    const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];
    const embedded = [...html.matchAll(/<style data-page-css="[^"]+">([\s\S]*?)<\/style>/g)];
    if (stylesheets.length || embedded.length !== 1 || !embedded[0][1].includes('.site-page')) throw new Error(`${name}: expected one complete embedded page stylesheet`);
    if (embedded[0].index > html.indexOf('<script') || embedded[0].index > html.indexOf('<body')) throw new Error(`${name}: stylesheet must precede scripts and body`);
    for (const match of embedded[0][1].matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      if (/^(?:data:|https?:|#)/.test(match[1])) continue;
      if (!(await stat(resolve(output, match[1].split(/[?#]/)[0]))).isFile()) throw new Error(`${name}: missing inline CSS asset ${match[1]}`);
      checks++;
    }
  }
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) checkCode(match[1], `${name}.inline.css`);
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
    checkCode(text, file);
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
async function checkSource(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { await checkSource(file); continue; }
    if (!/\.(?:html|css|js|mjs)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    if (file.endsWith('.html') && text.includes('<!--')) throw new Error(`${file}: HTML comment`);
    checkCode(text, file);
  }
}
await checkSource(resolve('src'));
await checkSource(resolve('scripts'));
console.log(`${pageNames.length} pages, ${checks} local paths and anchors checked`);
