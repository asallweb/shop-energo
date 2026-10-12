import { watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { buildSite, distDir, srcDir } from './build.mjs';

const { values } = parseArgs({
  options: {
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'string', default: '5173' },
    base: { type: 'string', default: '/' },
    strictPort: { type: 'boolean', default: false },
  },
});

const port = Number(values.port);
const base = `/${values.base.split('/').filter(Boolean).join('/')}${values.base === '/' ? '' : '/'}`;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Port must be an integer between 1 and 65535.');
}

await buildSite();

let timer;
let rebuild = Promise.resolve();
const watcher = watch(srcDir, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    rebuild = rebuild.then(buildSite).catch((error) => console.error(error));
  }, 100);
});

const server = createServer(async (request, response) => {
  try {
    await rebuild;
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);

    if (!pathname.startsWith(base)) {
      response.writeHead(404).end('Not found');
      return;
    }

    let filePath = resolve(distDir, pathname.slice(base.length));
    const relativePath = relative(distDir, filePath);

    if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    if ((await stat(filePath)).isDirectory()) {
      filePath = resolve(filePath, 'index.html');
    }

    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(content);
  } catch (error) {
    const status = error instanceof URIError ? 400 : error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500;
    response.writeHead(status).end(status === 404 ? 'Not found' : 'Request failed');
  }
});

server.on('error', (error) => {
  watcher.close();
  clearTimeout(timer);
  console.error(error.message);
  process.exitCode = 1;
});

server.listen(port, values.host, () => {
  console.log(`Local preview: http://${values.host}:${port}${base}`);
  console.log('Source changes rebuild dist/. Reload the browser to see changes.');
});

function closeServer() {
  clearTimeout(timer);
  watcher.close();
  server.close();
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
