import snapshot from '@/lib/agents.json';
import details from '@/lib/details.json';
import { composeMission, type MissionCatalog, type MissionInput } from '@/lib/mission-planner';
import { normalizeAgent, readPublicPage, type Agent, type AgentData, type Detail } from '@/lib/marketplace';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

async function missionCatalog(): Promise<MissionCatalog> {
  const bundled = snapshot as AgentData;
  let agents = bundled.agents;
  let fetchedAt = bundled.fetchedAt;
  let mode = 'verified-service-snapshot';
  try {
    const page = await readPublicPage();
    const list = page?.AgentMarketplaceAgentList?.agentList;
    if (Array.isArray(list?.list) && list.list.length) {
      const live = new Map<string, Agent>(
        list.list.slice(0, 50).map((value: Record<string, unknown>) => {
          const agent = normalizeAgent(value);
          return [agent.agentId, agent];
        }),
      );
      agents = bundled.agents.map((agent) => live.get(agent.agentId) ?? agent);
      fetchedAt = new Date().toISOString();
      mode = 'live-catalog+verified-service-snapshot';
    }
  } catch {
    // The bundled OKX.AI service snapshot keeps this read-only endpoint available.
  }
  return {
    agents,
    details: details as Record<string, Detail>,
    source: bundled.source,
    fetchedAt,
    mode,
  };
}

export async function GET(req: Request) {
  const endpoint = new URL('/api/a2mcp/compose', req.url).href;
  return json({
    name: 'Agentverse Mission Composer',
    version: '1.0.0',
    protocol: 'A2MCP',
    billing: 'free',
    description: '根据用户目标，从可核对的 OKX.AI Agent 服务中组合一条安全、只读的任务计划。',
    endpoint,
    method: 'POST',
    inputSchema: {
      type: 'object',
      required: ['goal'],
      properties: {
        goal: { type: 'string', minLength: 4, maxLength: 600 },
        maxAgents: { type: 'integer', minimum: 1, maximum: 4, default: 3 },
        riskMode: { type: 'string', enum: ['confirm-before-action'] },
      },
    },
    safety: {
      readOnly: true,
      automaticPayment: false,
      automaticExecution: false,
    },
  });
}

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return json({ error: '请求必须使用 application/json。' }, 415);
  if (Number(req.headers.get('content-length') ?? 0) > 8192)
    return json({ error: '请求内容过大。' }, 413);

  let input: MissionInput;
  try {
    const body = await req.text();
    if (body.length > 8192) throw new Error('too_large');
    input = JSON.parse(body) as MissionInput;
  } catch {
    return json({ error: '请求 JSON 无效。' }, 400);
  }

  if (!input || typeof input !== 'object' || typeof input.goal !== 'string')
    return json({ error: '缺少字符串字段 goal。' }, 400);
  if (input.maxAgents !== undefined && !Number.isInteger(input.maxAgents))
    return json({ error: 'maxAgents 必须是整数。' }, 400);

  try {
    const mission = composeMission(input, await missionCatalog());
    return json({
      requestId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...mission,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '任务编排失败。' }, 400);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
