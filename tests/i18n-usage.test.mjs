import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { SUPPORTED_LANGUAGES, translate } from '../src/domain/i18n.mjs';

test('all application translation calls resolve in every supported language', () => {
  const appSource = readFileSync(new URL('../public/app.mjs', import.meta.url), 'utf8');
  const keys = [...appSource.matchAll(/(?<![.\w])t\('([^']+)'/g)].map((match) => match[1]);
  const uniqueKeys = [...new Set(keys)];
  for (const language of SUPPORTED_LANGUAGES) {
    const missing = uniqueKeys.filter((key) => translate(key, language.code) === key);
    assert.deepEqual(missing, [], `missing ${language.code} translations: ${missing.join(', ')}`);
  }
});
