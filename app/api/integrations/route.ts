import {
  integrationAuditDate,
  integrationCatalog,
} from '@/lib/integrations/catalog';
import { mvpScope } from '@/lib/mvp-scope';

export async function GET() {
  return Response.json(
    {
      auditedAt: integrationAuditDate,
      policy: 'Unverified capabilities return NOT_CONNECTED or EXTERNAL_ONLY.',
      mvp: mvpScope,
      integrations: integrationCatalog,
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
