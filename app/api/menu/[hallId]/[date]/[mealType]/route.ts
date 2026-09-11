import { parseMealRequest } from '@/lib/meal-request';
import { retryRutgersMeal } from '@/lib/providers/rutgers-provider';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
export async function GET(_request: Request, { params }: { params: Promise<{ hallId: string; date: string; mealType: string }> }) {
  const { hallId, date, mealType } = await params;
  const input = parseMealRequest(hallId, date, mealType);
  if (!input) return Response.json({ error: 'Invalid meal request' }, { status: 400, headers });
  // At most one 4.5s school lookup plus one 4.5s meal body. Shared failed entries enforce cooldown.
  const result = await retryRutgersMeal(input.hallId, input.date, input.mealType);
  return Response.json(result, { headers });
}
