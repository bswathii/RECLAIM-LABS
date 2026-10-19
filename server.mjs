import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const projectRoot = resolve(fileURLToPath(new URL('./', import.meta.url)));
const publicRoot = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const sourceRoot = resolve(fileURLToPath(new URL('./src/', import.meta.url)));
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function safePath(urlPath) {
  const pathname = decodeURIComponent((urlPath || '/').split('?')[0]);
  const isSourceModule = pathname.startsWith('/src/');
  const requested = isSourceModule
    ? pathname.slice('/src/'.length)
    : pathname === '/' ? '/index.html' : pathname;
  const base = isSourceModule ? sourceRoot : publicRoot;
  const candidate = normalize(join(base, requested));
  const allowedRoot = isSourceModule ? sourceRoot : publicRoot;
  return candidate.startsWith(`${allowedRoot}${'\\'}`) || candidate.startsWith(`${allowedRoot}/`) ? candidate : null;
}

const server = createServer((request, response) => {
  const filePath = safePath(request.url);
  if (!filePath) {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Reclaim Labs is running at http://localhost:${port}`);
});
