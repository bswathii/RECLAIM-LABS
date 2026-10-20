import { inspectQwenConfig, QWEN_MODEL } from '../server/qwen-config.mjs';

const status = inspectQwenConfig();

console.log(`Qwen server boundary: ${status.configured ? 'READY' : 'BLOCKED'}`);
console.log(`QWEN_MODEL: ${status.modelValid ? `valid (${QWEN_MODEL})` : `invalid (must equal ${QWEN_MODEL})`}`);
console.log(`QWEN_ENDPOINT: ${status.endpointConfigured ? 'configured (value withheld)' : 'missing'}`);
console.log(`QWEN_API_KEY: ${status.apiKeyConfigured ? 'configured (value withheld)' : 'missing'}`);
console.log(`Browser exposure check: ${status.browserBoundary.ok ? 'PASS' : 'FAIL'}`);
console.log('Inference: not attempted (offline configuration check only).');

if (status.blockers.length > 0) {
  console.log('Blockers:');
  for (const blocker of status.blockers) console.log(`- ${blocker}`);
}

process.exitCode = status.configured ? 0 : 1;
