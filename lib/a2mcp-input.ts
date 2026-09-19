export const defaultMissionRequest = {
  goal: '研究 BTC 市场状态，并检查 X Layer 代币风险',
  assetSymbol: 'BTC',
  chainId: 'eip155:196',
  maxAgents: 3,
  riskMode: 'confirm-before-action',
} as const;

type RequestSource = 'provided' | 'default-example';
type RequestFormat = 'json' | 'form' | 'text' | 'empty';

const wrapperKeys = ['input', 'params', 'arguments', 'request', 'payload'];
const allowedKeys = [
  'goal',
  'maxAgents',
  'riskMode',
  'assetSymbol',
  'chainId',
  'contractAddress',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function unwrap(value: unknown): unknown {
  if (!isRecord(value)) return value;
  for (const key of wrapperKeys) {
    if (value[key] !== undefined) return value[key];
  }
  return value;
}

function normalizeEnvelope(value: unknown) {
  const unwrapped = unwrap(value);
  if (typeof unwrapped === 'string') return { goal: unwrapped };
  if (!isRecord(unwrapped))
    throw new Error('请求必须是 JSON 对象、文本目标或受支持的参数封装。');

  const normalized: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (unwrapped[key] !== undefined) normalized[key] = unwrapped[key];
  }

  if (normalized.goal === undefined) {
    for (const alias of ['query', 'prompt', 'task', 'message']) {
      if (typeof unwrapped[alias] === 'string') {
        normalized.goal = unwrapped[alias];
        break;
      }
    }
  }
  if (normalized.maxAgents === undefined)
    normalized.maxAgents = unwrapped.max_agents;
  if (normalized.assetSymbol === undefined)
    normalized.assetSymbol = unwrapped.asset_symbol;
  if (normalized.chainId === undefined) normalized.chainId = unwrapped.chain_id;
  if (normalized.contractAddress === undefined)
    normalized.contractAddress = unwrapped.contract_address;

  if (
    typeof normalized.maxAgents === 'string' &&
    /^\d+$/.test(normalized.maxAgents)
  )
    normalized.maxAgents = Number(normalized.maxAgents);
  return normalized;
}

export function parseA2mcpRequest(body: string, contentType: string | null) {
  const trimmed = body.trim();
  if (!trimmed)
    return {
      value: { ...defaultMissionRequest },
      source: 'default-example' as RequestSource,
      format: 'empty' as RequestFormat,
    };

  let value: unknown;
  let format: RequestFormat;
  if (
    contentType?.includes('application/json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[')
  ) {
    value = JSON.parse(trimmed);
    format = 'json';
  } else if (contentType?.includes('application/x-www-form-urlencoded')) {
    value = Object.fromEntries(new URLSearchParams(trimmed));
    format = 'form';
  } else {
    value = trimmed;
    format = 'text';
  }

  return {
    value: normalizeEnvelope(value),
    source: 'provided' as RequestSource,
    format,
  };
}
