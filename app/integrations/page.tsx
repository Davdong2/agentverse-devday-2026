import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash2,
  ExternalLink,
  FileWarning,
  RadioTower,
  ShieldCheck,
} from 'lucide-react';
import {
  integrationAuditDate,
  integrationCatalog,
} from '@/lib/integrations/catalog';
import type {
  CapabilityStatus,
  IntegrationStatus,
} from '@/lib/integrations/types';

export const metadata: Metadata = {
  title: 'Integration Audit · Agentverse',
  description:
    'MetAgents、TapeOut 与 Ignix 的官方接口、合约、权限、限制和 Agentverse 接入状态。',
};

const statusText: Record<IntegrationStatus | CapabilityStatus, string> = {
  'connected-read': 'READ CONNECTED',
  verified: 'VERIFIED',
  'external-only': 'EXTERNAL ONLY',
  'not-connected': 'NOT CONNECTED',
};

export default function IntegrationsPage() {
  const verifiedReads = integrationCatalog.flatMap((item) =>
    item.capabilities.filter(
      (capability) =>
        capability.mode === 'read' && capability.status === 'verified',
    ),
  ).length;
  const verifiedWrites = integrationCatalog.flatMap((item) =>
    item.capabilities.filter(
      (capability) =>
        capability.mode !== 'read' && capability.status === 'verified',
    ),
  ).length;

  return (
    <main className="integration-audit">
      <header className="audit-topbar">
        <Link href="/" className="audit-back">
          <ArrowLeft size={16} /> Agentverse World
        </Link>
        <span>
          <ShieldCheck size={15} /> Phase 0 · Integration Audit
        </span>
        <time dateTime={integrationAuditDate}>{integrationAuditDate}</time>
      </header>

      <section className="audit-overview">
        <div>
          <small>AGENTVERSE MVP 2.0 / SOURCE OF TRUTH</small>
          <h1>协议能力审计</h1>
          <p>
            只有官方文档、官方产品或实时链上读取能够证实的能力才会启用。未公开的接口不会通过抓取私有端点或本地模拟补齐。
          </p>
        </div>
        <dl>
          <div>
            <dt>协议</dt>
            <dd>{integrationCatalog.length}</dd>
          </div>
          <div>
            <dt>已接只读能力</dt>
            <dd>{verifiedReads}</dd>
          </div>
          <div>
            <dt>已接写入能力</dt>
            <dd>{verifiedWrites}</dd>
          </div>
          <div>
            <dt>审计写交易</dt>
            <dd>0</dd>
          </div>
        </dl>
      </section>

      <section className="audit-guardrail" aria-label="审计结论">
        <FileWarning size={21} />
        <div>
          <strong>当前 MVP 不能按原流程宣称端到端完成。</strong>
          <p>
            MetAgents 尚无公开的用户 Agent 创建 API；TapeOut Container
            是电路持有者控制的链上容器，不是原生 Agent 身份；Ignix Directed
            Vault 是发行时锁定的交易税收款地址，不等于通用 Agent Revenue
            Router。
          </p>
        </div>
      </section>

      <nav className="audit-jump" aria-label="协议审计索引">
        {integrationCatalog.map((integration, index) => (
          <a key={integration.id} href={`#${integration.id}`}>
            <span>0{index + 1}</span>
            {integration.name}
            <i className={`status-dot ${integration.status}`} />
          </a>
        ))}
      </nav>

      <section className="audit-protocols">
        {integrationCatalog.map((integration, index) => (
          <article
            className={`audit-protocol ${integration.status}`}
            id={integration.id}
            key={integration.id}
          >
            <header>
              <span>0{index + 1}</span>
              <div>
                <small>{integration.proposedRole}</small>
                <h2>{integration.name}</h2>
                <p>{integration.verifiedRole}</p>
              </div>
              <b className={`audit-status ${integration.status}`}>
                {statusText[integration.status]}
              </b>
            </header>

            <p className="audit-summary">{integration.summary}</p>

            <div className="audit-facts">
              <section>
                <small>API</small>
                <p>{integration.api}</p>
              </section>
              <section>
                <small>SDK</small>
                <p>{integration.sdk}</p>
              </section>
              <section>
                <small>AUTHENTICATION</small>
                <p>{integration.authentication}</p>
              </section>
            </div>

            <section className="audit-section">
              <h3>Available functions</h3>
              <div className="capability-list">
                {integration.capabilities.map((capability) => (
                  <div className="capability-row" key={capability.id}>
                    <code>{capability.id}()</code>
                    <span>{capability.mode}</span>
                    <b className={`audit-status ${capability.status}`}>
                      {statusText[capability.status]}
                    </b>
                    <p>
                      {capability.notes}
                      <small>{capability.authentication}</small>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="audit-section">
              <h3>Contracts & ABI</h3>
              <div className="contract-list">
                {integration.contracts.map((contract) => (
                  <div key={contract.name}>
                    <span>
                      <strong>{contract.name}</strong>
                      <small>{contract.network}</small>
                    </span>
                    {contract.address ? (
                      <code>{contract.address}</code>
                    ) : (
                      <em>NOT PUBLISHED</em>
                    )}
                    <p>
                      {contract.notes} · ABI: {contract.abi}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="audit-two-column">
              <section className="audit-section">
                <h3>Limitations</h3>
                <ul>
                  {integration.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </section>
              <section className="audit-section">
                <h3>Read-only checks</h3>
                <div className="audit-checks">
                  {integration.checks.map((check) => (
                    <div key={check.label}>
                      {check.status === 'passed' ? (
                        <CheckCircle2 size={15} />
                      ) : check.status === 'blocked' ? (
                        <CircleSlash2 size={15} />
                      ) : (
                        <RadioTower size={15} />
                      )}
                      <span>
                        <strong>{check.label}</strong>
                        <small>{check.result}</small>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <footer>
              <strong>Official sources</strong>
              <div>
                {integration.sources.map((source) => (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    key={source.id}
                  >
                    {source.label} <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </footer>
          </article>
        ))}
      </section>

      <section className="audit-next">
        <small>PHASE 1 GATE</small>
        <h2>先做 Wallet 与可验证的数据层</h2>
        <p>
          下一阶段可以安全实现连接 OKX Wallet / MetaMask、切换 X
          Layer、签名和发送交易的基础层；协议写入功能继续由 adapter
          保护，直到对应官方接口通过最小只读和测试交易验证。
        </p>
        <Link href="/api/integrations">
          查看机器可读能力清单 <ArrowUpRight size={15} />
        </Link>
      </section>
    </main>
  );
}
