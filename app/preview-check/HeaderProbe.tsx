'use client';

import { useState } from 'react';

const publicHeaders = ['content-type', 'cache-control', 'age', 'date', 'etag', 'strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-vercel-cache', 'x-vercel-id'] as const;

export function HeaderProbe() {
  const [result, setResult] = useState('No requests made.');
  const [busy, setBusy] = useState(false);
  async function probe(includeHall: boolean) {
    setBusy(true);
    try {
      // Fixed same-origin targets only. Browser authentication stays in the
      // browser; cookies, authorization and redirect values are never displayed.
      const script = document.querySelector<HTMLScriptElement>('script[src^="/_next/static/"]');
      const asset = script?.getAttribute('src');
      const targets = includeHall ? ['/hall/atrium'] : ['/profile', ...(asset?.startsWith('/_next/static/') ? [asset] : [])];
      const rows = [];
      for (const path of targets) {
        const response = await fetch(path, { credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(20_000) });
        rows.push({ path, observedAt: new Date().toISOString(), status: response.status, headers: Object.fromEntries(publicHeaders.map(name => [name, response.headers.get(name)])) });
        await response.body?.cancel();
      }
      setResult(JSON.stringify(rows, null, 2));
    } catch {
      setResult('Header request failed or exceeded 20 seconds. No response headers were verified.');
    } finally {
      setBusy(false);
    }
  }
  return <section className="space-y-3" aria-label="Effective response headers">
    <p>These buttons make ordinary same-origin GET requests. Only public response headers are shown. No analytics request is made.</p>
    <button type="button" disabled={busy} className="rounded border px-3 py-2" onClick={() => void probe(false)}>Check profile and static headers</button>
    <button type="button" disabled={busy} className="rounded border px-3 py-2" onClick={() => void probe(true)}>Check Atrium response headers</button>
    <pre role="status" className="overflow-auto rounded border p-3 text-xs">{busy ? 'Checking response headers…' : result}</pre>
  </section>;
}
