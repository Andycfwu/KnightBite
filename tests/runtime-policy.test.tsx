import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSupportedRuntime } from '../scripts/verify-runtime.mjs';

const baseline = { node: '24.19.0', openssl: '3.5.7', undici: '7.29.0', llhttp: '9.4.3' };

test('the reviewed hosting runtime and newer Node 24 patches are accepted', () => {
  assert.doesNotThrow(() => assertSupportedRuntime(baseline));
  assert.doesNotThrow(() => assertSupportedRuntime({ ...baseline, node: '24.21.0', openssl: '3.5.8', undici: '7.29.1' }));
});

test('old, unsupported and prerelease Node versions fail the build policy', () => {
  for (const node of ['24.18.1', '24.0.0', '22.25.0', '25.0.0', '26.8.2', '24.19.0-rc.1', 'invalid', '']) {
    assert.throws(() => assertSupportedRuntime({ ...baseline, node }), /requires a reviewed Node 24/);
  }
});

test('component patch evidence cannot be absent or older than the reviewed security baseline', () => {
  for (const [component, version] of Object.entries({ openssl: '3.5.6', undici: '7.28.9', llhttp: '9.4.2' })) {
    assert.throws(() => assertSupportedRuntime({ ...baseline, [component]: version }), new RegExp(`requires ${component}`));
    assert.throws(() => assertSupportedRuntime({ ...baseline, [component]: undefined }), new RegExp(`requires ${component}`));
  }
});
