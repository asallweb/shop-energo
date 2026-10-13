import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { build } from 'esbuild';
import { pages } from './pages.mjs';
import { renderPage } from './templates.mjs';
import { buildAssets } from './assets.mjs';

export const rootDir = fileURLToPath(new URL('../', import.meta.url));
export const srcDir = join(rootDir, 'src');
export const distDir = resolve(rootDir, 'dist');

export async function buildSite() {
  if (relative(rootDir, distDir) !== 'dist') {
    throw new Error('Build output must be the project dist directory.');
  }

  await rm(distDir, { recursive: true, force: true });
  await mkdir(join(distDir, 'css'), { recursive: true });
  await mkdir(join(distDir, 'js'), { recursive: true });

  const replaceAssets = await buildAssets({ rootDir, srcDir, distDir });
  const cssVersions = new Map();
  for (const name of ['app', ...Object.keys(pages)]) {
    const cssInput = join(srcDir, 'css', name === 'app' ? 'app.css' : `pages/${name}.css`);
    const cssOutput = join(distDir, 'css', `${name}.min.css`);
    const result = await postcss([postcssImport(), autoprefixer(), cssnano({ preset: 'default' })])
      .process(await readFile(cssInput, 'utf8'), { from: cssInput, to: cssOutput, map: false });
    for (const warning of result.warnings()) console.warn(warning.toString());
    const css = replaceAssets(result.css);
    await writeFile(cssOutput, css);
    cssVersions.set(name, createHash('sha256').update(css).digest('hex').slice(0, 12));
  }
  await build({
    entryPoints: [join(srcDir, 'js', 'main.js')],
    outdir: join(distDir, 'js'),
    entryNames: 'app.min',
    chunkNames: 'chunks/[name]-[hash]',
    bundle: true,
    minify: true,
    legalComments: 'none',
    format: 'esm',
    splitting: true,
    platform: 'browser',
    target: ['es2020'],
    logLevel: 'warning',
  });

  const jsVersion = createHash('sha256').update(await readFile(join(distDir, 'js', 'app.min.js'))).digest('hex').slice(0, 12);

  for (const [name, config] of Object.entries(pages)) {
    let html = await renderPage(await readFile(join(srcDir, `${name}.html`), 'utf8'), name, config, srcDir);
    html = html.replace('href="css/app.min.css"', `href="css/app.min.css?v=${cssVersions.get('app')}"`)
      .replace('src="js/app.min.js"', `src="js/app.min.js?v=${jsVersion}"`)
      .replace('</head>', `  <link rel="stylesheet" href="css/${name}.min.css?v=${cssVersions.get(name)}">\n    <link rel="icon" href="assets/images/logo-symbol.svg" type="image/svg+xml">\n    <link rel="preload" href="assets/fonts/arimo-regular.woff2" as="font" type="font/woff2" crossorigin>\n    <link rel="preload" href="assets/fonts/arimo-bold.woff2" as="font" type="font/woff2" crossorigin>\n  </head>`)
      .replace('<link rel="stylesheet" href="css/app.min.css', '<link rel="preload" as="image" href="assets/images/header-background.webp" fetchpriority="high">\n    <link rel="preload" as="image" href="assets/images/header-haze-left.svg">\n    <link rel="preload" as="image" href="assets/images/header-haze-right.svg">\n    <link rel="stylesheet" href="css/app.min.css');
    let mainPhoto = false;
    const mainStart = html.indexOf('<main');
    html = html.replace(/<img\b[^>]+>/g, (tag, offset) => {
      const priority = !mainPhoto && /hero__image|product-gallery__image/.test(tag);
      if (priority) mainPhoto = true;
      if (offset < mainStart || priority) return tag.replace(/>$/, `${priority ? ' fetchpriority="high"' : ''} decoding="async">`);
      return tag.replace(/>$/, ' loading="lazy" decoding="async">');
    });
    await writeFile(join(distDir, `${name}.html`), replaceAssets(html));
  }

  await writeFile(join(distDir, 'pages.html'), await readFile(join(srcDir, 'pages.html'), 'utf8'));
  await writeFile(join(distDir, '.nojekyll'), '');
  console.log('Built dist/');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await buildSite();
}
