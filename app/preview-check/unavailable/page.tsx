import { notFound } from 'next/navigation';
import { HallMenuView } from '@/components/menu/HallMenuView';
import { diningHalls } from '@/lib/dining-halls';
import { isPreviewDeployment } from '@/lib/preview-runtime';
import { getRutgersNowParts } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function PreviewUnavailablePage() {
  if (!isPreviewDeployment()) notFound();
  const referenceTime = '2026-09-11T00:30:00Z';
  const requestedDate = getRutgersNowParts(new Date(referenceTime)).isoDate;
  const hall = diningHalls.find(entry => entry.id === 'atrium')!;
  return <>
    <aside className="border p-3 text-sm" aria-label="Controlled Preview scenario">Controlled Preview check: unavailable result, UTC reference {referenceTime}, Rutgers requested date {requestedDate}. No provider request or sample food. This verifies the rendered state, not a live ingestion failure.</aside>
    <HallMenuView hall={hall} menu={null} requestedDate={requestedDate} />
  </>;
}
