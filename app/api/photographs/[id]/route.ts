import { worldStore } from '@/lib/server-store';
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[-0-9a-f]{36}$/.test(id))
    return new Response('无效图片 ID', { status: 400 });
  const store = worldStore();
  if (!store) return new Response('存储暂不可用', { status: 503 });
  const image = await store.get('photographs/' + id + '.png');
  if (!image)
    return new Response('图片尚未生成完成或生成失败', { status: 404 });
  return new Response(image.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': 'inline; filename="agentverse-' + id + '.png"',
    },
  });
}
