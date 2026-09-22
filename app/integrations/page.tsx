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
import { mvpScope } from '@/lib/mvp-scope';
import type {
  CapabilityStatus,
  IntegrationStatus,
} from '@/lib/integrations/types';

export const metadata: Metadata = {
  title: '当前能力 · Agentverse',
  description:
    'Agentverse 当前真实可用能力，以及 MetAgents、TapeOut 与 Ignix 的接入边界。',
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
          <ShieldCheck size={15} /> Real MVP · Verified Capabilities
        </span>
        <time dateTime={integrationAuditDate}>{integrationAuditDate}</time>
      </header>

      <section className="audit-overview">
        <div>
          <small>AGENTVERSE MVP 2.0 / CURRENT SCOPE</small>
          <h1>只做现在能完成的功能</h1>
          <p>
            当前版本只开放真实可操作、来源可核对的路径。没有公开接口的能力直接退出产品流程，不用本地数据假装协议已经接通。
          </p>
        </div>
        <dl>
          <div>
            <dt>当前能力</dt>
            <dd>{mvpScope.flow.length}</dd>
          </div>
          <div>
            <dt>已接协议读取</dt>
            <dd>{verifiedReads}</dd>
          </div>
          <div>
            <dt>协议写入</dt>
            <dd>{verifiedWrites}</dd>
          </div>
          <div>
            <dt>伪造链上结果</dt>
            <dd>0</dd>
          </div>
        </dl>
      </section>

      <section className="mvp-scope" aria-label="当前真实 MVP">
        <header>
          <small>CURRENT REAL MVP</small>
          <h2>一条可以真的走完的路径</h2>
          <p>
            浏览真实 Agent 资料，查看服务，生成任务计划；如果 Ignix
            官方索引存在关联，就读取并展示。发行操作只交给官方产品完成。
          </p>
        </header>
        <div className="mvp-flow">
          {mvpScope.flow.map((item, index) => {
            const body = (
              <>
                <span>0{index + 1}</span>
                <b>{item.label}</b>
                <p>{item.detail}</p>
                <small>{item.source}</small>
                <em>{item.mode.replace('-', ' ')}</em>
              </>
            );
            return item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                {body}
              </a>
            ) : (
              <Link href={item.route ?? '/'} key={item.id}>
                {body}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="audit-guardrail" aria-label="审计结论">
        <FileWarning size={21} />
        <div>
          <strong>这些能力不进入当前 MVP。</strong>
          <p>
            {mvpScope.excluded.map((item) => item.label).join('、')}
            。它们会在官方接口和权限真正可验证后再单独接入，而不是靠演示数据补齐。
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
        <small>SCOPE GATE</small>
        <h2>以后也按同一条规则扩展</h2>
        <p>
          新能力必须先通过官方资料、鉴权方式和最小测试验证，再进入产品。未接入能力继续由
          adapter 返回明确的 NOT_CONNECTED 或 EXTERNAL_ONLY；不会生成假的 Agent
          ID、Container、交易哈希、余额或收入。
        </p>
        <Link href="/api/integrations">
          查看机器可读能力清单 <ArrowUpRight size={15} />
        </Link>
      </section>
    </main>
  );
}
