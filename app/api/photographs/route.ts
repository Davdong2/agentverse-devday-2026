import snapshot from '@/lib/agents.json';
import details from '@/lib/details.json';
import { imageKey, worldStore } from '@/lib/server-store';
import { scenePrompt } from '@/lib/scene-prompt';
import type { Detail } from '@/lib/marketplace';
import { stateNames, type State } from '@/lib/world-model';
export async function GET() {
  return Response.json(
    {
      configured: Boolean(imageKey()),
      model: 'gpt-image-2',
      size: '2048x1152',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin !== new URL(req.url).origin)
    return Response.json({ error: '请求来源不匹配' }, { status: 403 });
  if (!req.headers.get('content-type')?.includes('application/json'))
    return Response.json({ error: '需要场景数据' }, { status: 415 });
  if (Number(req.headers.get('content-length') ?? 0) > 4096)
    return Response.json({ error: '场景数据过大' }, { status: 413 });
  let b: {
    agentId?: unknown;
    node?: unknown;
    state?: unknown;
    requestId?: unknown;
  };
  try {
    const text = await req.text();
    if (text.length > 4096) throw new Error();
    b = JSON.parse(text);
  } catch {
    return Response.json({ error: '场景数据无效' }, { status: 400 });
  }
  if (
    !b || typeof b !== 'object' ||
    typeof b.agentId !== 'string' ||
    typeof b.node !== 'number' ||
    !Number.isInteger(b.node) ||
    b.node < 0 ||
    b.node > 3 ||
    typeof b.state !== 'string' ||
    !Object.hasOwn(stateNames, b.state) ||
    typeof b.requestId !== 'string' ||
    !/^[-0-9a-f]{36}$/.test(b.requestId)
  )
    return Response.json({ error: '场景参数无效' }, { status: 400 });
  const agent = snapshot.agents.find((a) => a.agentId === b.agentId);
  if (!agent) return Response.json({ error: '未找到 Agent' }, { status: 404 });
  const key = imageKey();
  if (!key)
    return Response.json(
      {
        error: '尚未配置图片生成服务。场景描述仍可导出。',
        code: 'not_configured',
      },
      { status: 503 },
    );
  const store = worldStore();
  if (!store)
    return Response.json({ error: '图片存储暂不可用' }, { status: 503 });
  const imagePath = 'photographs/' + b.requestId + '.png',
    metaPath = 'photographs/' + b.requestId + '.json';
  const existing = await store.head(imagePath);
  if (existing)
    return Response.json({ url: '/api/photographs/' + b.requestId });
  if (await store.head(metaPath))
    return Response.json(
      {
        error: '这次生成请求已提交，请稍后查看结果；不会重复扣费。',
        code: 'already_requested',
        url: '/api/photographs/' + b.requestId,
      },
      { status: 409 },
    );
  const createdAt = new Date().toISOString();
  const claimed = await store.put(
    metaPath,
    JSON.stringify({
      status: 'submitted',
      createdAt,
      agentId: agent.agentId,
      node: b.node,
      state: b.state,
    }),
    { onlyIf: new Headers({ 'If-None-Match': '*' }) },
  );
  if (!claimed) return Response.json({ error: '这次生成请求已提交，请稍后查看结果。', code: 'already_requested', url: '/api/photographs/' + b.requestId }, { status: 409 });
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-2',
        prompt: scenePrompt(
          agent,
          b.node,
          b.state as State,
          (details as Record<string, Detail>)[agent.agentId],
        ),
        n: 1,
        size: '2048x1152',
        quality: 'high',
        output_format: 'png',
      }),
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) {
      await store.put(
        metaPath,
        JSON.stringify({
          status: 'failed',
          createdAt,
          upstreamStatus: res.status,
        }),
      );
      return Response.json(
        {
          error:
            res.status === 429
              ? '图片服务额度暂不可用，请恢复后再生成。'
              : '图片生成未成功，请检查服务配置后重试。',
        },
        { status: 502 },
      );
    }
    const result = (await res.json()) as { data?: { b64_json?: string }[] };
    const encoded = result.data?.[0]?.b64_json;
    if (!encoded) throw new Error('No image');
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    await store.put(imagePath, bytes, {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: {
        agentId: agent.agentId,
        node: String(b.node),
        createdAt,
      },
    });
    await store.put(
      metaPath,
      JSON.stringify({
        status: 'complete',
        createdAt,
        agentId: agent.agentId,
        node: b.node,
        state: b.state,
      }),
    );
    return Response.json({ url: '/api/photographs/' + b.requestId });
  } catch {
    return Response.json(
      {
        error: '图片生成连接中断，请先查看当前请求结果，避免重复生成。',
        url: '/api/photographs/' + b.requestId,
        code: 'uncertain',
      },
      { status: 504 },
    );
  }
}
