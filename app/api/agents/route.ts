import { getAgentCatalog } from '@/lib/agent-catalog';

export async function GET() {
  return Response.json(await getAgentCatalog(), {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
  });
}
