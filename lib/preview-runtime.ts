// Server-only callers. Never expose environment objects or request credentials.
export function isPreviewDeployment() {
  return process.env.VERCEL_ENV === 'preview';
}

export function getPreviewRuntimeEvidence() {
  if (!isPreviewDeployment()) return null;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  const region = process.env.VERCEL_REGION;
  return {
    observedAt: new Date().toISOString(),
    environment: 'preview',
    commit: commit && /^[a-f0-9]{40}$/.test(commit) ? commit : null,
    region: region && /^[a-z0-9-]{1,32}$/.test(region) ? region : null,
    node: process.versions.node,
    openssl: process.versions.openssl,
    undici: process.versions.undici ?? null,
    llhttp: process.versions.llhttp ?? null,
    platform: process.platform,
    arch: process.arch
  };
}

let menuRuntimeReported = false;
export function reportPreviewMenuRuntime() {
  if (menuRuntimeReported || !isPreviewDeployment()) return;
  try {
    menuRuntimeReported = true;
    console.info(JSON.stringify({ event: 'knightbite.preview_function_runtime', caller: 'menu_loader', ...getPreviewRuntimeEvidence() }));
  } catch {
    // Diagnostics must never change a menu result, deadline or exception policy.
  }
}
