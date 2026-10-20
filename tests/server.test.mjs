import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { QWEN_MODEL } from '../server/qwen-config.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const serverPath = fileURLToPath(new URL('../server.mjs', import.meta.url));

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    let output = '';

    const onData = (chunk) => {
      output += chunk;
      const match = output.match(/Reclaim Labs is running at http:\/\/localhost:(\d+)/);
      if (match) {
        cleanup();
        resolve(Number(match[1]));
      }
    };
    const onExit = (code, signal) => {
      cleanup();
      reject(new Error(`server exited before startup (code=${code}, signal=${signal})\n${output}`));
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      child.stdout.off('data', onData);
      child.off('exit', onExit);
      child.off('error', onError);
    };

    child.stdout.on('data', onData);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

function requestPath(port, path) {
  return new Promise((resolve, reject) => {
    const clientRequest = request({ hostname: '127.0.0.1', port, path }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.once('end', () => {
        resolve({
          statusCode: response.statusCode,
          body: Buffer.concat(chunks).toString('utf8')
        });
      });
    });
    clientRequest.once('error', reject);
    clientRequest.end();
  });
}

function requestJson(port, path, body, { method = 'POST', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const clientRequest = request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload), ...headers }
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.once('end', () => resolve({ statusCode: response.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    clientRequest.once('error', reject);
    clientRequest.end(payload);
  });
}

test('malformed URL escapes return 400 and the server remains available', async (t) => {
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill());

  const port = await waitForServer(child);
  const malformed = await requestPath(port, '/%E0%A4%A');
  assert.equal(malformed.statusCode, 400);
  assert.equal(malformed.body, 'Bad request');

  const afterMalformed = await requestPath(port, '/');
  assert.equal(afterMalformed.statusCode, 200);
  assert.match(afterMalformed.body, /Reclaim Labs/);
});

test('encoded path traversal stays outside the public and source roots', async (t) => {
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill());

  const port = await waitForServer(child);
  const publicTraversal = await requestPath(port, '/%2e%2e/server.mjs');
  const sourceTraversal = await requestPath(port, '/src/%2e%2e/server.mjs');
  assert.equal(publicTraversal.statusCode, 400);
  assert.equal(sourceTraversal.statusCode, 400);
});

test('health endpoint reports a healthy service', async (t) => {
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill());

  const port = await waitForServer(child);
  const health = await requestPath(port, '/healthz');
  assert.equal(health.statusCode, 200);
  assert.deepEqual(JSON.parse(health.body), { ok: true, service: 'reclaim-labs' });
});

test('assistant endpoint returns a safe deterministic fallback when Qwen is not configured', async (t) => {
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '0', QWEN_MODEL, QWEN_ENDPOINT: '', QWEN_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill());

  const port = await waitForServer(child);
  const response = await requestJson(port, '/api/assistant', { question: 'How does UDGAM work?', language: 'en' });
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.provider, 'deterministic-fallback');
  assert.equal(body.status, 'fallback');
  assert.match(body.answer, /search facility/i);
  assert.doesNotMatch(response.body, /QWEN_API_KEY|test-secret|Bearer/);
});

test('assistant endpoint bounds methods and request bodies without exposing configuration', async (t) => {
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '0', QWEN_MODEL, QWEN_ENDPOINT: '', QWEN_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill());

  const port = await waitForServer(child);
  const method = await requestJson(port, '/api/assistant', {}, { method: 'GET' });
  assert.equal(method.statusCode, 405);
  assert.equal(JSON.parse(method.body).error, 'method-not-allowed');

  const malformed = await requestJson(port, '/api/assistant', '{bad-json');
  assert.equal(malformed.statusCode, 400);
  assert.equal(JSON.parse(malformed.body).error, 'invalid-json');

  const oversized = await requestJson(port, '/api/assistant', 'x'.repeat(17 * 1024));
  assert.equal(oversized.statusCode, 413);
  assert.equal(JSON.parse(oversized.body).error, 'request-too-large');
  assert.doesNotMatch(oversized.body, /QWEN_API_KEY|Bearer/);
});
