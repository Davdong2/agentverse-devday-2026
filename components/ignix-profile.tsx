import type { IgnixData } from '@/lib/ignix';
import { ArrowUpRight } from 'lucide-react';
export function IgnixBadge() {
  return (
    <span
      className="ig-badge"
      title="IGNIX 官方索引返回了 Agent 关联"
      aria-label="IGNIX 官方索引关联"
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
  if (!link?.tokens.length)
    return (
      <section className="dossier-card ignix-profile ignix-empty">
        <h3>
          <span>
            <IgnixBadge /> IGNIX 经济
          </span>
          <small>NOT CONNECTED</small>
        </h3>
        <strong>官方索引暂未发现关联代币</strong>
        <p>
          Agentverse 不在站内模拟发币、Vault、Treasury
          或收入。需要发行时，请进入 Ignix 官方流程并由钱包自行确认。
        </p>
        <a
          className="ignix-evidence"
          href="https://ignix.bot/launch"
          target="_blank"
          rel="noreferrer"
        >
          前往 Ignix 官方发行页 <ArrowUpRight size={12} />
        </a>
        <small className="dossier-source">
          外部官方流程 · Agentverse 不代签
        </small>
      </section>
    );
  return (
    <section className="dossier-card ignix-profile">
      <h3>
        <span>
          <IgnixBadge /> IGNIX 代币
        </span>
        <small>{data.mode === 'fresh' ? 'LIVE' : '缓存'}</small>
      </h3>
      <div className="ignix-verification">
        已发币 · 官方索引关联（资金状态另行链上核验）
      </div>
      {link.tokens.map((token) => (
        <article className="ignix-token" key={token.address}>
          <strong>{token.symbol}</strong>
          <span>{token.name}</span>
          <small>
            索引显示{token.graduated ? '已毕业' : '曲线发行中'} · X Layer
          </small>
          <a href={token.url} target="_blank" rel="noreferrer">
            查看 IGNIX 代币 <ArrowUpRight size={13} />
          </a>
          <code>{token.address}</code>
        </article>
      ))}
      <p className="ignix-read-note">
        当前只展示官方索引中的代币关联。未公开定义的
        asp.rev、Treasury、可提现余额和交易税收益均不展示。
      </p>
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
        查看官方索引页 <ArrowUpRight size={12} />
      </a>
    </section>
  );
}
