import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const QWEN_MODEL = 'Qwen/Qwen3-8B';

const projectRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const browserRoots = ['public', 'src/domain'];
const browserTextExtensions = new Set(['.css', '.html', '.js', '.mjs', '.json', '.svg']);
const browserOnlyMarkers = [
  'QWEN_MODEL',
  'QWEN_ENDPOINT',
  'QWEN_API_KEY',
  QWEN_MODEL
];

function textFilesUnder(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...textFilesUnder(path));
    } else if (browserTextExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

export function findBrowserBoundaryLeaks(root = projectRoot) {
  const leaks = [];
  for (const relativeRoot of browserRoots) {
    const directory = join(root, relativeRoot);
    for (const filePath of textFilesUnder(directory)) {
      const contents = readFileSync(filePath, 'utf8');
      for (const marker of browserOnlyMarkers) {
        if (contents.includes(marker)) {
          leaks.push({ file: filePath, marker });
        }
      }
    }
  }
  return { ok: leaks.length === 0, leaks };
}

export function inspectQwenConfig(env = process.env, root = projectRoot) {
  // The approved model is the safe default from the repository contract. An
  // explicitly supplied value is still validated so a typo cannot silently
  // select another model.
  const model = typeof env.QWEN_MODEL === 'string' && env.QWEN_MODEL.trim().length > 0
    ? env.QWEN_MODEL
    : QWEN_MODEL;
  const endpointConfigured = typeof env.QWEN_ENDPOINT === 'string' && env.QWEN_ENDPOINT.trim().length > 0;
  const apiKeyConfigured = typeof env.QWEN_API_KEY === 'string' && env.QWEN_API_KEY.trim().length > 0;
  const modelValid = model === QWEN_MODEL;
  const browserBoundary = findBrowserBoundaryLeaks(root);
  const blockers = [];

  if (!modelValid) blockers.push(`QWEN_MODEL must equal ${QWEN_MODEL}`);
  if (!endpointConfigured) blockers.push('QWEN_ENDPOINT is missing');
  if (!apiKeyConfigured) blockers.push('QWEN_API_KEY is missing');
  if (!browserBoundary.ok) blockers.push('server-only Qwen markers are exposed to browser-served code');

  return {
    modelValid,
    endpointConfigured,
    apiKeyConfigured,
    browserBoundary,
    configured: blockers.length === 0,
    blockers
  };
}
