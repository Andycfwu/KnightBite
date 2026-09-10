import { Analytics } from '@vercel/analytics/next';
import { isPreviewDeployment } from '@/lib/preview-runtime';

export function DeploymentAnalytics() {
  // Do not load the collector script in hosted test sessions. Production keeps
  // its existing analytics behavior; this is not a client-controlled opt-out.
  if (isPreviewDeployment() || process.env.NEXT_PUBLIC_ANALYTICS_DISABLED === '1') return null;
  return <Analytics />;
}
