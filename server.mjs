import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { answerWithQwen, MAX_QUESTION_LENGTH } from './server/qwen-adapter.mjs';

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
const MAX_ASSISTANT_BODY_BYTES = 16 * 1024;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    request.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_ASSISTANT_BODY_BYTES) {
        request.resume();
        fail(new Error('request-too-large'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (settled) return;
      settled = true;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid-json'));
      }
    });
    request.on('error', fail);
  });
}

function safePath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent((urlPath || '/').split('?')[0]);
  } catch {
    return null;
  }

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
  const requestPath = (request.url || '').split('?')[0];
  if (requestPath === '/api/assistant') {
    if (request.method !== 'POST') {
      response.setHeader('allow', 'POST');
      sendJson(response, 405, { error: 'method-not-allowed' });
      return;
    }
    readJsonBody(request).then(async (body) => {
      const question = typeof body?.question === 'string' ? body.question : '';
      const language = typeof body?.language === 'string' ? body.language : 'en';
      if (!question.trim() || question.length > MAX_QUESTION_LENGTH) {
        sendJson(response, 400, { error: 'invalid-question' });
        return;
      }
      const result = await answerWithQwen(question, { language, logger: console });
      sendJson(response, 200, result);
    }).catch((error) => {
      sendJson(response, error.message === 'request-too-large' ? 413 : 400, {
        error: error.message === 'request-too-large' ? 'request-too-large' : 'invalid-json'
      });
    });
    return;
  }
  if (requestPath === '/healthz') {
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    });
    response.end(JSON.stringify({ ok: true, service: 'reclaim-labs' }));
    return;
  }
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
  const address = server.address();
  const listeningPort = typeof address === 'object' && address ? address.port : port;
  console.log(`Reclaim Labs is running at http://localhost:${listeningPort}`);
});
