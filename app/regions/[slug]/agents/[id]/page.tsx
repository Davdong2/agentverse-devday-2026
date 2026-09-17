import Civilization from '@/components/civilization';
import { regionSlugs } from '@/lib/civilization-model';
import { notFound } from 'next/navigation';
export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const n = regionSlugs.indexOf(slug);
  if (n < 0 || !/^\d{1,15}$/.test(id)) notFound();
  return <Civilization key={slug + id} regionIndex={n} profileId={id} />;
}
