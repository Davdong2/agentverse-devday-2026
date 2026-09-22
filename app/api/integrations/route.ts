import {
  integrationAuditDate,
  integrationCatalog,
} from '@/lib/integrations/catalog';

export async function GET() {
  return Response.json(
    {
      auditedAt: integrationAuditDate,
      policy: 'Unverified capabilities return NOT_CONNECTED or EXTERNAL_ONLY.',
      integrations: integrationCatalog,
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
