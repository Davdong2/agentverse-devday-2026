import type { Weather } from './civilization-model';
export type NewsItem = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  category: string;
  weather: Weather;
  region: number;
};
export type WorldNews = {
  source: string;
  fetchedAt: string;
  mode: 'fresh' | 'cached' | 'stale';
  items: NewsItem[];
};
export type NewsReaction = NewsItem & { until: number };
const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => {
      const code = n[0] === 'x' ? parseInt(n.slice(1), 16) : Number(n);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
export function parseWorldNews(xml: string, now = Date.now()): NewsItem[] {
  if (!/<rss[\s>]/i.test(xml) || xml.length > 2500000)
    throw new Error('Invalid RSS');
  const seen = new Set<string>();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, 80)
    .flatMap(([, item]) => {
      const field = (key: string) =>
        decode(
          item.match(
            new RegExp(
              '<' + key + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + key + '>',
              'i',
            ),
          )?.[1] ?? '',
        );
      const title = field('title').slice(0, 300),
        publishedAt = field('pubDate'),
        date = Date.parse(publishedAt);
      let url: URL;
      try {
        url = new URL(field('link'));
      } catch {
        return [];
      }
      if (
        url.protocol !== 'https:' ||
        !['www.coindesk.com', 'coindesk.com'].includes(url.hostname) ||
        !title ||
        !Number.isFinite(date) ||
        date > now + 300000 ||
        now - date > 172800000 ||
        seen.has(url.href)
      )
        return [];
      seen.add(url.href);
      // Keyword routing describes the visual response; it is not a verified economic conclusion.
      const category =
        /\b(hack|exploit|breach|black swan|liquidation|crash)\b/i.test(title)
          ? '风险信号'
          : /\bETF\b/i.test(title)
            ? 'ETF 动态'
            : /\b(earnings|quarterly|revenue|financial results)\b/i.test(title)
              ? '财报动态'
              : /\b(onchain|on-chain|token|memecoin|stablecoin|layer[- ]?2|x layer)\b/i.test(
                    title,
                  )
                ? '链上动态'
                : '市场资讯';
      return [
        {
          id: url.href,
          title,
          url: url.href,
          publishedAt: new Date(date).toISOString(),
          category,
          weather: (category === '风险信号'
            ? 'attack'
            : category === '链上动态'
              ? 'chain'
              : 'news') as Weather,
          region: category === '风险信号' ? 6 : category === '链上动态' ? 9 : 1,
        },
      ];
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 8);
}
