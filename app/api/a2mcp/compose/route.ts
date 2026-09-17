import snapshot from '@/lib/agents.json';
import details from '@/lib/details.json';
import { getAgentCatalog } from '@/lib/agent-catalog';
import {
  composeMission,
  normalizeMissionInput,
  type MissionCatalog,
} from '@/lib/mission-planner';
import { type Agent, type AgentData, type Detail } from '@/lib/marketplace';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

const rateLimit = 60;
const rateWindowMs = 60_000;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

async function missionCatalog(): Promise<MissionCatalog> {
  const bundled = snapshot as AgentData;
  const catalog = await getAgentCatalog();
  const live = new Map<string, Agent>(
    catalog.agents.map((agent) => [agent.agentId, agent]),
  );
  return {
    agents: bundled.agents.map((agent) => live.get(agent.agentId) ?? agent),
    details: details as Record<string, Detail>,
    source: bundled.source,
    fetchedAt: catalog.fetchedAt,
    mode: `${catalog.mode ?? 'snapshot'}-catalog+verified-service-snapshot`,
  };
}

function consumeRateLimit(req: Request) {
  const now = Date.now();
  const key = req.headers.get('cf-connecting-ip') ?? 'local';
  let bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + rateWindowMs };
    requestBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (requestBuckets.size > 2_000) {
    for (const [storedKey, value] of requestBuckets) {
      if (value.resetAt <= now) requestBuckets.delete(storedKey);
    }
  }
  return {
    allowed: bucket.count <= rateLimit,
    remaining: Math.max(0, rateLimit - bucket.count),
    resetSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
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
      additionalProperties: false,
      properties: {
        goal: { type: 'string', minLength: 4, maxLength: 600 },
        maxAgents: { type: 'integer', minimum: 1, maximum: 4, default: 3 },
        riskMode: { type: 'string', enum: ['confirm-before-action'] },
        assetSymbol: {
          type: 'string',
          pattern: '^[A-Za-z0-9._-]{1,20}$',
          description: '可选资产或代币符号，例如 BTC、ETH 或 OKB。',
        },
        chainId: {
          type: 'string',
          pattern: '^eip155:[0-9]{1,12}$',
          description: '可选 CAIP-2 链 ID；X Layer 为 eip155:196。',
        },
        contractAddress: {
          type: 'string',
          pattern: '^0x[a-fA-F0-9]{40}$',
          description: '可选 EVM 合约地址。',
        },
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
  const limit = consumeRateLimit(req);
  const rateHeaders = {
    'X-RateLimit-Limit': String(rateLimit),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Reset': String(limit.resetSeconds),
  };
  if (!limit.allowed)
    return Response.json(
      { error: '请求过于频繁，请稍后再试。' },
      {
        status: 429,
        headers: { ...corsHeaders, ...rateHeaders, 'Retry-After': String(limit.resetSeconds) },
      },
    );
  if (!req.headers.get('content-type')?.includes('application/json'))
    return Response.json(
      { error: '请求必须使用 application/json。' },
      { status: 415, headers: { ...corsHeaders, ...rateHeaders } },
    );
  if (Number(req.headers.get('content-length') ?? 0) > 8192)
    return Response.json(
      { error: '请求内容过大。' },
      { status: 413, headers: { ...corsHeaders, ...rateHeaders } },
    );

  let input: ReturnType<typeof normalizeMissionInput>;
  try {
    const body = await req.text();
    if (body.length > 8192) throw new Error('too_large');
    input = normalizeMissionInput(JSON.parse(body));
  } catch (error) {
    const message = error instanceof SyntaxError
      ? '请求 JSON 无效。'
      : error instanceof Error && error.message !== 'too_large'
        ? error.message
        : '请求内容过大。';
    return Response.json(
      { error: message },
      { status: error instanceof Error && error.message === 'too_large' ? 413 : 400, headers: { ...corsHeaders, ...rateHeaders } },
    );
  }

  try {
    const mission = composeMission(input, await missionCatalog());
    return Response.json(
      {
        requestId: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...mission,
      },
      { headers: { ...corsHeaders, ...rateHeaders } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '任务编排失败。' },
      { status: 400, headers: { ...corsHeaders, ...rateHeaders } },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
