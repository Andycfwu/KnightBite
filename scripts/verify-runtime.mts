import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// Reviewed against Node's July 2026 security release and the application API
// surface. Newer component advisories and limitations: docs/RUNTIME_POLICY.md.
export function assertSupportedRuntime(versions: Record<string, string | undefined>): void {
  const node = /^(\d+)\.(\d+)\.(\d+)$/.exec(versions.node ?? '');
  if (!node || Number(node[1]) !== 24 || Number(node[2]) < 19) {
    throw new Error('KnightBite requires a reviewed Node 24 runtime (>=24.19.0 <25).');
  }
  const minimums = { openssl: [3, 5, 7], undici: [7, 29, 0], llhttp: [9, 4, 3] };
  for (const [component, minimum] of Object.entries(minimums)) {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:[+-].*)?$/.exec(versions[component] ?? '');
    const actual = match?.slice(1, 4).map(Number);
    const comparison = actual?.map((part, index) => Math.sign(part - minimum[index])).find(part => part !== 0) ?? 0;
    if (!actual || comparison < 0) {
      throw new Error(`KnightBite requires ${component} >=${minimum.join('.')} in its Node runtime.`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertSupportedRuntime(process.versions);
  const require = createRequire(import.meta.url);
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  console.log(JSON.stringify({
    event: 'knightbite_build_runtime',
    commit: commit && /^[a-f0-9]{40}$/.test(commit) ? commit : null,
    node: process.versions.node,
    openssl: process.versions.openssl,
    undici: process.versions.undici,
    llhttp: process.versions.llhttp,
    platform: process.platform,
    arch: process.arch,
    sharp: require('sharp').versions
  }));
}
