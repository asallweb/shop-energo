import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function renderPage(source, name, config, srcDir) {
  let html = source;
  for (const match of source.matchAll(/<!-- include: ([a-z-]+) -->/g)) {
    let partial = await readFile(join(srcDir, 'partials', `${match[1]}.html`), 'utf8');
    if (match[1] === 'header' && config.navigation) {
      partial = partial.replace(`class="header__nav-link" href="./${config.navigation}.html"`, `class="header__nav-link header__nav-link--current" href="./${config.navigation}.html" aria-current="page"`);
    }
    if (match[1] === 'sidebar' && config.category) {
      partial = partial.replace('href="./catalog.html"', 'href="./catalog.html" aria-current="page"');
    }
    partial = partial.replaceAll('{{newsModifier}}', name === 'index' ? '' : ' news--compact');
    if (match[1] === 'news' && name !== 'index') {
      const split = partial.indexOf('<div class="news__list" role="tabpanel" id="offers-panel"');
      partial = partial.slice(0, split).replace(/\d+\. Новости — /g, '').replaceAll('\u00a0', ' ') + partial.slice(split).replaceAll('\u00a0', ' ');
    }
    html = html.replace(match[0], partial.trim());
  }
  html = html.replace('<body>', `<body data-page="${name}">`);
  html = html.replace('<meta name="viewport"', `<meta name="description" content="${config.description}">\n    <meta name="viewport"`);
  return html;
}
