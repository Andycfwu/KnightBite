import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPreviewRuntimeEvidence } from '@/lib/preview-runtime';
import { HeaderProbe } from './HeaderProbe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function PreviewCheckPage() {
  const evidence = getPreviewRuntimeEvidence();
  if (!evidence) notFound();
  return <main className="space-y-5 text-sm">
    <h1 className="text-2xl font-semibold">Preview release verification</h1>
    <p>Analytics is suppressed on this Preview. This request-time record comes from this function invocation, not the build log. No credentials or user data are included.</p>
    <pre aria-label="Function runtime evidence" className="overflow-auto rounded border p-3 text-xs">{JSON.stringify(evidence, null, 2)}</pre>
    <HeaderProbe />
    <p><Link href="/hall/atrium">Open the actual Atrium menu</Link></p>
    <p><Link href="/preview-check/unavailable">Open the controlled unavailable/date-boundary check</Link></p>
    <p>This verification surface returns 404 outside Vercel Preview. Do not promote its Preview-built artifact as a production build: build the approved source in Production to retain production analytics.</p>
  </main>;
}
