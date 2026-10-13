import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname, join, relative } from 'node:path';
import sharp from 'sharp';

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

export async function buildAssets({ rootDir, srcDir, distDir }) {
  const source = join(srcDir, 'assets');
  const cache = join(rootDir, '.local', 'cache', 'images');
  await mkdir(cache, { recursive: true });
  const replacements = new Map();
  let originalBytes = 0;
  let outputBytes = 0;
  const raster = path => /\.(?:png|jpe?g|webp)$/.test(path);
  await cp(source, join(distDir, 'assets'), {
    recursive: true,
    filter: path => !raster(path) && !path.endsWith('.ttf') && !path.endsWith('.gitkeep'),
  });
  for (const path of await files(source)) {
    if (!raster(path)) continue;
    const input = await readFile(path);
    const key = createHash('sha256').update(input).update('webp-v1-q92-max1200-header1920').digest('hex');
    const cached = join(cache, key + '.webp');
    let output;
    try { output = await readFile(cached); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const lossless = /map|certificate|payment|symbol/.test(path);
      output = await sharp(input).resize({ width: path.includes('header-background') ? 1920 : 1200, withoutEnlargement: true }).webp({ quality: 92, lossless, effort: 6 }).toBuffer();
      await writeFile(cached, output);
    }
    const hash = createHash('sha256').update(output).digest('hex').slice(0, 10);
    const original = relative(srcDir, path).replaceAll('\\', '/');
    const destination = original.slice(0, -extname(path).length) + `.${hash}.webp`;
    await mkdir(join(distDir, destination, '..'), { recursive: true });
    await writeFile(join(distDir, destination), output);
    replacements.set(original, destination);
    originalBytes += input.length;
    outputBytes += output.length;
  }
  console.log(`Images: ${originalBytes} → ${outputBytes} bytes`);
  return text => {
    for (const [original, replacement] of replacements) text = text.replaceAll(original, replacement);
    return text;
  };
}
