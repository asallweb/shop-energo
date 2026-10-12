import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { build } from 'esbuild';

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

  const cssInput = join(srcDir, 'css', 'app.css');
  const cssOutput = join(distDir, 'css', 'app.min.css');
  const cssResult = await postcss([
    postcssImport(),
    autoprefixer(),
    cssnano({ preset: 'default' }),
  ]).process(await readFile(cssInput, 'utf8'), {
    from: cssInput,
    to: cssOutput,
    map: false,
  });

  for (const warning of cssResult.warnings()) {
    console.warn(warning.toString());
  }

  await writeFile(cssOutput, cssResult.css);
  await build({
    entryPoints: [join(srcDir, 'js', 'main.js')],
    outfile: join(distDir, 'js', 'app.min.js'),
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    logLevel: 'warning',
  });

  await cp(join(srcDir, 'assets'), join(distDir, 'assets'), {
    recursive: true,
    filter: (path) => !path.endsWith('.gitkeep'),
  });

  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      await cp(join(srcDir, entry.name), join(distDir, entry.name));
    }
  }

  await writeFile(join(distDir, '.nojekyll'), '');
  console.log('Built dist/');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await buildSite();
}
