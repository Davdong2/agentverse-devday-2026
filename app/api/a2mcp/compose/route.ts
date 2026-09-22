import snapshot from '@/lib/agents.json';
import details from '@/lib/details.json';
import { defaultMissionRequest, parseA2mcpRequest } from '@/lib/a2mcp-input';
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

const exampleRequest = defaultMissionRequest;
const serviceVersion = '1.1.0';

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function errorJson({
  requestId,
  code,
  error,
  hint,
  status,
  headers = {},
}: {
  requestId: string;
  code: string;
  error: string;
  hint: string;
  status: number;
  headers?: Record<string, string>;
}) {
  console.info(
    JSON.stringify({
      event: 'a2mcp_result',
      serviceVersion,
      requestId,
      status,
      code,
    }),
  );
  return Response.json(
    {
      ok: false,
      deliveryStatus: 'failed',
      requestId,
      code,
      error,
      hint,
      exampleRequest,
      serviceVersion,
    },
    { status, headers: { ...corsHeaders, ...headers } },
  );
}

function missionCatalog(): MissionCatalog {
  const bundled = snapshot as AgentData;
  return {
    agents: bundled.agents as Agent[],
    details: details as Record<string, Detail>,
    source: bundled.source,
    fetchedAt: bundled.fetchedAt,
    mode: 'verified-service-snapshot',
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
    version: serviceVersion,
    protocol: 'A2MCP',
    billing: 'free',
    deliverable: 'collaboration-plan',
    limitations:
      'Returns a plan from a dated service-catalog snapshot, not completed downstream research, an audit, or a trade. No downstream service is called or paid.',
    description:
      '根据用户目标，从可核对的 OKX.AI Agent 服务中组合一条安全、只读的任务计划。',
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
    delivery: {
      success: 'HTTP 200 直接返回 JSON 任务计划，deliveryStatus 为 delivered。',
      failure:
        'HTTP 4xx 返回稳定 code、可读 error、修复指引 hint 和可直接重试的 exampleRequest。',
      emptyProbe:
        '空 POST、JSON {} 或空参数封装用于可用性自检，会使用 exampleRequest 并返回 HTTP 200 示例交付。',
    },
    acceptedRequestFormats: [
      'JSON 对象',
      'input/params/arguments/request/payload 参数封装',
      '纯文本 goal',
      'application/x-www-form-urlencoded',
      '空 POST、JSON {} 或空参数封装可用性自检',
    ],
    exampleRequest,
  });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const limit = consumeRateLimit(req);
  const rateHeaders = {
    'X-RateLimit-Limit': String(rateLimit),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Reset': String(limit.resetSeconds),
  };
  if (!limit.allowed)
    return errorJson({
      requestId,
      code: 'RATE_LIMITED',
      error: '请求过于频繁。',
      hint: `请在 ${limit.resetSeconds} 秒后使用原参数重试。`,
      status: 429,
      headers: { ...rateHeaders, 'Retry-After': String(limit.resetSeconds) },
    });
  if (Number(req.headers.get('content-length') ?? 0) > 8192)
    return errorJson({
      requestId,
      code: 'PAYLOAD_TOO_LARGE',
      error: '请求内容超过 8192 字节。',
      hint: '缩短 goal 和可选参数后重试；goal 最长 600 个字符。',
      status: 413,
      headers: rateHeaders,
    });

  let input: ReturnType<typeof normalizeMissionInput>;
  let inputMeta: ReturnType<typeof parseA2mcpRequest>;
  try {
    const body = await req.text();
    if (body.length > 8192) throw new Error('too_large');
    inputMeta = parseA2mcpRequest(body, req.headers.get('content-type'));
    input = normalizeMissionInput(inputMeta.value);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'too_large';
    const invalidJson = error instanceof SyntaxError;
    return errorJson({
      requestId,
      code: tooLarge
        ? 'PAYLOAD_TOO_LARGE'
        : invalidJson
          ? 'INVALID_JSON'
          : 'INVALID_INPUT',
      error: tooLarge
        ? '请求内容超过 8192 字节。'
        : invalidJson
          ? '请求 JSON 无效。'
          : error instanceof Error
            ? error.message
            : '请求参数无效。',
      hint: invalidJson
        ? '检查 JSON 引号、逗号和括号，再按 exampleRequest 重试。'
        : '对照 exampleRequest 修正字段名称、类型和取值范围后重试。',
      status: tooLarge ? 413 : 400,
      headers: rateHeaders,
    });
  }

  try {
    const mission = composeMission(input, missionCatalog());
    const delivery = {
      type: 'collaboration-plan',
      completed: true,
      downstreamExecuted: false,
      catalogAsOf: mission.provenance.fetchedAt,
      notice:
        '已完成协作计划编排。候选服务与价格来自上述日期的目录快照，调用前需重新核对。本次没有执行下游研究、审计或交易。',
      report: [
        `协作计划：${mission.goal}`,
        ...mission.steps.map(
          (step) =>
            `${step.order}. ${step.role}：${step.agentName} / ${step.serviceName}（Agent ${step.agentId}，Service ${step.serviceId}）。${step.reason} ${step.serviceUrl}`,
        ),
        `目录快照时间：${mission.provenance.fetchedAt}。上述为待执行的候选步骤，本次交付为计划本身。`,
      ].join('\n'),
    };
    console.info(
      JSON.stringify({
        event: 'a2mcp_result',
        serviceVersion,
        requestId,
        status: 200,
        source: inputMeta.source,
        steps: mission.steps.length,
      }),
    );
    return Response.json(
      {
        ok: true,
        deliveryStatus: 'delivered',
        requestId,
        serviceVersion,
        delivery,
        createdAt: new Date().toISOString(),
        input: {
          source: inputMeta.source,
          format: inputMeta.format,
          ...(inputMeta.source === 'default-example'
            ? {
                notice:
                  '未收到有效请求参数；已使用公开 exampleRequest 完成可用性示例交付。',
              }
            : {}),
        },
        ...mission,
      },
      { headers: { ...corsHeaders, ...rateHeaders } },
    );
  } catch (error) {
    return errorJson({
      requestId,
      code: 'NO_MATCHING_SERVICES',
      error: error instanceof Error ? error.message : '任务编排失败。',
      hint: '在 goal 中补充任务类型（如市场研究、风险验证、链上数据、创意交付或执行准备），并可选提供 assetSymbol、chainId 或 contractAddress。',
      status: 422,
      headers: rateHeaders,
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
