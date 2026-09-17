import type { IgnixData } from '@/lib/ignix';
import { ArrowUpRight } from 'lucide-react';
export function IgnixBadge() {
  return (
    <span
      className="ig-badge"
      title="IGNIX 已关联发币"
      aria-label="IGNIX 已关联发币"
    >
      ig
    </span>
  );
}
export default function IgnixProfile({
  data,
  agentId,
}: {
  data: IgnixData;
  agentId: string;
}) {
  const link = data.associations[agentId];
  if (!link?.tokens.length) return null;
  return (
    <section className="dossier-card ignix-profile">
      <h3>
        <span>
          <IgnixBadge /> IGNIX 代币
        </span>
        <small>{data.mode === 'fresh' ? 'LIVE' : '缓存'}</small>
      </h3>
      <div className="ignix-verification">已发币 · IGNIX 身份关联</div>
      {link.tokens.map((token) => (
        <article className="ignix-token" key={token.address}>
          <strong>{token.symbol}</strong>
          <span>{token.name}</span>
          <small>{token.graduated ? '已毕业' : '曲线发行中'} · X Layer</small>
          <a href={token.url} target="_blank" rel="noreferrer">
            查看 IGNIX 代币 <ArrowUpRight size={13} />
          </a>
          <code>{token.address}</code>
        </article>
      ))}
      <div className="ignix-revenue">
        <span>托管结算收入 · IGNIX 累计口径</span>
        <strong>
          {link.revenueUsd === null
            ? '暂无数据'
            : '$ ' +
              Number(link.revenueUsd).toLocaleString('en-US', {
                maximumFractionDigits: 6,
              })}
          <small>{link.revenueUsd !== null ? ' USD' : ''}</small>
        </strong>
        <p>
          来自 OKX AI 托管结算记录的美元口径，不代表代币交易收益或可提现余额。
        </p>
      </div>
      <small className="dossier-source">
        {data.stale ? '同步暂不可用 · ' : ''}核对于{' '}
        {new Date(data.fetchedAt).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
        })}
      </small>
      <a
        className="ignix-evidence"
        href={'https://ignix.bot/agents?id=' + agentId}
        target="_blank"
        rel="noreferrer"
      >
        查看关联依据 <ArrowUpRight size={12} />
      </a>
    </section>
  );
}
