import Civilization from '@/components/civilization';
import { regionSlugs } from '@/lib/civilization-model';
import { notFound } from 'next/navigation';
export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const n = regionSlugs.indexOf(slug);
  if (n < 0) notFound();
  return <Civilization key={slug} regionIndex={n} />;
}
