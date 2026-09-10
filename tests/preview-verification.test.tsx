import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Analytics } from '@vercel/analytics/next';
import { DeploymentAnalytics } from '@/components/layout/DeploymentAnalytics';
import PreviewCheckPage from '@/app/preview-check/page';
import PreviewUnavailablePage from '@/app/preview-check/unavailable/page';
import { getPreviewRuntimeEvidence, reportPreviewMenuRuntime } from '@/lib/preview-runtime';

test('only Preview suppresses analytics; production and normal local behavior remain enabled', () => {
  const before = { ...process.env };
  try {
    delete process.env.NEXT_PUBLIC_ANALYTICS_DISABLED;
    for (const environment of ['production', 'development', undefined]) {
      if (environment) process.env.VERCEL_ENV = environment;
      else delete process.env.VERCEL_ENV;
      assert.equal(DeploymentAnalytics()?.type, Analytics);
    }
    process.env.VERCEL_ENV = 'preview';
    assert.equal(DeploymentAnalytics(), null);
    process.env.VERCEL_ENV = 'production';
    process.env.NEXT_PUBLIC_ANALYTICS_DISABLED = '1';
    assert.equal(DeploymentAnalytics(), null, 'existing deliberate local override is retained');
  } finally { process.env = before; }
});

test('verification pages and runtime records are unavailable outside Preview', () => {
  const before = process.env.VERCEL_ENV;
  try {
    for (const environment of ['production', 'development', undefined]) {
      if (environment) process.env.VERCEL_ENV = environment;
      else delete process.env.VERCEL_ENV;
      assert.equal(getPreviewRuntimeEvidence(), null);
      for (const page of [PreviewCheckPage, PreviewUnavailablePage]) {
        assert.throws(page, /NEXT_HTTP_ERROR_FALLBACK;404/);
      }
    }
  } finally {
    if (before === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = before;
  }
});

test('Preview records actual process versions and only allowlisted public metadata', () => {
  const before = { ...process.env };
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_GIT_COMMIT_SHA = 'not-a-commit';
    process.env.VERCEL_REGION = 'unexpected value';
    process.env.TEST_PRIVATE_VALUE = 'private-synthetic-canary';
    const record = getPreviewRuntimeEvidence()!;
    assert.equal(record.node, process.versions.node);
    assert.equal(record.openssl, process.versions.openssl);
    assert.equal(record.commit, null);
    assert.equal(record.region, null);
    assert.ok(Math.abs(Date.now() - Date.parse(record.observedAt)) < 1000);
    assert.deepEqual(Object.keys(record).sort(), ['observedAt', 'environment', 'commit', 'region', 'node', 'openssl', 'undici', 'llhttp', 'platform', 'arch'].sort());
    assert.doesNotMatch(JSON.stringify(record), /private-synthetic-canary/);
  } finally { process.env = before; }
});

test('Preview runtime console failure cannot affect the menu caller or repeat logging', t => {
  const before = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'preview';
  const log = t.mock.method(console, 'info', () => { throw new Error('Console unavailable'); });
  try {
    assert.doesNotThrow(reportPreviewMenuRuntime);
    assert.doesNotThrow(reportPreviewMenuRuntime);
    assert.equal(log.mock.callCount(), 1);
  } finally {
    if (before === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = before;
  }
});
