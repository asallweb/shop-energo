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
  if (name !== 'pages') {
    const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];
    if (stylesheets.length !== 1 || !stylesheets[0][0].includes('blocking="render"')) throw new Error(`${name}: expected one render-blocking page stylesheet`);
    if (stylesheets[0].index > html.indexOf('<script')) throw new Error(`${name}: stylesheet must precede scripts`);
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
