import assert from 'node:assert/strict';
import test from 'node:test';
import { findBrowserBoundaryLeaks, inspectQwenConfig, QWEN_MODEL } from '../server/qwen-config.mjs';

test('Qwen configuration requires the exact approved model and never exposes secret values', () => {
  const status = inspectQwenConfig({
    QWEN_MODEL,
    QWEN_ENDPOINT: 'https://qwen.example.invalid/v1',
    QWEN_API_KEY: 'test-only-secret'
  });

  assert.equal(status.modelValid, true);
  assert.equal(status.endpointConfigured, true);
  assert.equal(status.apiKeyConfigured, true);
  assert.equal(status.configured, true);
  assert.deepEqual(status.blockers, []);
  assert.deepEqual(Object.keys(status).sort(), [
    'apiKeyConfigured',
    'blockers',
    'browserBoundary',
    'configured',
    'endpointConfigured',
    'modelValid'
  ]);
});

test('missing endpoint and key are explicit blockers without making an inference call', () => {
  const status = inspectQwenConfig({ QWEN_MODEL });

  assert.equal(status.configured, false);
  assert.deepEqual(status.blockers, ['QWEN_ENDPOINT is missing', 'QWEN_API_KEY is missing']);
});

test('missing model environment uses the approved repository default', () => {
  const status = inspectQwenConfig({});

  assert.equal(status.modelValid, true);
  assert.deepEqual(status.blockers, ['QWEN_ENDPOINT is missing', 'QWEN_API_KEY is missing']);
});

test('the actual browser-served roots contain no Qwen configuration markers', () => {
  const boundary = findBrowserBoundaryLeaks();

  assert.equal(boundary.ok, true);
  assert.deepEqual(boundary.leaks, []);
});

test('a non-exact model is rejected', () => {
  const status = inspectQwenConfig({
    QWEN_MODEL: 'Qwen/Qwen3-8B:latest',
    QWEN_ENDPOINT: 'configured',
    QWEN_API_KEY: 'configured'
  });

  assert.equal(status.modelValid, false);
  assert.equal(status.configured, false);
  assert.deepEqual(status.blockers, [`QWEN_MODEL must equal ${QWEN_MODEL}`]);
});
