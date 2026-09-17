'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Network,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import styles from './mission-console.module.css';

type MissionStep = {
  order: number;
  agentId: string;
  agentName: string;
  serviceId: number;
  serviceName: string;
  serviceType: string;
  price: string;
  symbol: string;
  reason: string;
  serviceUrl: string;
};

type MissionPlan = {
  requestId: string;
  goal: string;
  createdAt: string;
  summary: string;
  steps: MissionStep[];
  request: {
    maxAgents: number;
    riskMode: 'confirm-before-action';
    assetSymbol?: string;
    chainId?: string;
    contractAddress?: string;
  };
  provenance: { source: string; fetchedAt: string; mode: string };
  safety: {
    automaticPayment: false;
    automaticExecution: false;
    note: string;
  };
};

const examples = [
  '研究 BTC 市场状态，并检查一个 X Layer 代币的合约风险',
  '收集今天的加密新闻，找出值得继续研究的市场主题',
  '为一个新的 AI Agent 设计品牌视觉，并生成发布内容',
];

const endpointPath = '/api/a2mcp/compose';

type WebMcpContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<unknown>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

export function MissionConsole() {
  const [goal, setGoal] = useState(examples[0]);
  const [assetSymbol, setAssetSymbol] = useState('BTC');
  const [contractAddress, setContractAddress] = useState('');
  const [maxAgents, setMaxAgents] = useState(3);
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const contractValid = !contractAddress.trim() || /^0x[a-fA-F0-9]{40}$/.test(contractAddress.trim());

  useEffect(() => {
    const context = (document as Document & { modelContext?: WebMcpContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'compose_okx_ai_mission',
      title: '编排 OKX.AI 任务',
      description: '根据目标生成可核对的 OKX.AI Agent 服务计划，并在当前页面显示结果。只读，不付款、不签名、不交易。',
      inputSchema: {
        type: 'object',
        properties: {
          goal: { type: 'string', minLength: 4, maxLength: 600 },
          maxAgents: { type: 'integer', minimum: 1, maximum: 4, default: 3 },
          assetSymbol: { type: 'string', pattern: '^[A-Za-z0-9._-]{1,20}$' },
          chainId: { type: 'string', pattern: '^eip155:[0-9]{1,12}$' },
          contractAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        },
        required: ['goal'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input) {
        if (!input || typeof input !== 'object') throw new Error('需要任务目标。');
        const value = input as {
          goal?: unknown;
          maxAgents?: unknown;
          assetSymbol?: unknown;
          chainId?: unknown;
          contractAddress?: unknown;
        };
        if (typeof value.goal !== 'string' || value.goal.trim().length < 4)
          throw new Error('goal 至少需要 4 个字符。');
        if (value.maxAgents !== undefined && !Number.isInteger(value.maxAgents))
          throw new Error('maxAgents 必须是整数。');
        const response = await fetch('/api/a2mcp/compose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal: value.goal,
            maxAgents: value.maxAgents ?? 3,
            riskMode: 'confirm-before-action',
            assetSymbol: value.assetSymbol,
            chainId: value.chainId,
            contractAddress: value.contractAddress,
          }),
        });
        const result = (await response.json()) as MissionPlan & { error?: string };
        if (!response.ok) throw new Error(result.error || '任务规划暂时不可用');
        setGoal(value.goal);
        setPlan(result);
        setError('');
        return {
          requestId: result.requestId,
          summary: result.summary,
          steps: result.steps.map((step) => ({
            agentId: step.agentId,
            serviceId: step.serviceId,
            serviceName: step.serviceName,
          })),
        };
      },
    }, { signal: lifecycle.signal })).catch(() => {
      // WebMCP is an optional browser capability; the visible workflow remains available.
    });
    return () => lifecycle.abort();
  }, []);

  async function composeMission() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/a2mcp/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          maxAgents,
          riskMode: 'confirm-before-action',
          assetSymbol: assetSymbol.trim() || undefined,
          chainId: 'eip155:196',
          contractAddress: contractAddress.trim() || undefined,
        }),
      });
      const result = (await response.json()) as MissionPlan & { error?: string };
      if (!response.ok) throw new Error(result.error || '任务规划暂时不可用');
      setPlan(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '任务规划暂时不可用');
    } finally {
      setLoading(false);
    }
  }

  async function copyEndpoint() {
    try {
      const endpoint = new URL(endpointPath, window.location.href).href;
      await navigator.clipboard.writeText(endpoint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('复制失败，请手动复制端点路径。');
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.backdrop} aria-hidden="true" />
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Agentverse Mission Console 首页">
          <span className={styles.brandMark}><Network /></span>
          <span><strong>AGENTVERSE</strong><small>OKX.AI MISSION CONSOLE</small></span>
        </Link>
        <div className={styles.headerStatus}>
          <Badge variant="outline" className={styles.liveBadge}>
            <Radio /> PUBLIC A2MCP
          </Badge>
          <Link className={styles.worldLink} href="/world" prefetch={false}>
            <span className={styles.worldLabel}>进入可视化世界</span>
            <span className={styles.mobileWorldLabel}>3D 世界</span>
            <ArrowRight />
          </Link>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.composer}>
          <div className={styles.eyebrow}><Sparkles /> 新任务</div>
          <h1>把目标交给一组<br />真正可核对的 Agent</h1>
          <p className={styles.intro}>
            输入一个目标。Agentverse 会从 OKX.AI 服务资料中选择相关能力，返回带 Agent ID、Service ID、价格和来源的核对型计划。
          </p>

          <label className={styles.fieldLabel} htmlFor="mission-goal">你想完成什么？</label>
          <Textarea
            id="mission-goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className={styles.textarea}
            maxLength={600}
            aria-describedby="mission-safety"
          />
          <div className={styles.contextGrid}>
            <label htmlFor="mission-asset">
              <span>资产或代币</span>
              <Input
                id="mission-asset"
                value={assetSymbol}
                onChange={(event) => setAssetSymbol(event.target.value)}
                maxLength={20}
                placeholder="BTC / ETH / OKB"
                aria-label="资产或代币符号"
              />
            </label>
            <label className={styles.contractField} htmlFor="mission-contract">
              <span>X Layer 合约地址 <small>可选</small></span>
              <Input
                id="mission-contract"
                value={contractAddress}
                onChange={(event) => setContractAddress(event.target.value)}
                placeholder="0x…"
                aria-label="X Layer 合约地址"
                aria-invalid={!contractValid}
              />
              {!contractValid && <small role="alert">请输入 42 位 EVM 合约地址。</small>}
            </label>
            <label htmlFor="mission-agent-limit">
              <span>最多使用</span>
              <NativeSelect
                id="mission-agent-limit"
                value={String(maxAgents)}
                onChange={(event) => setMaxAgents(Number(event.target.value))}
                aria-label="最多使用的 Agent 数量"
              >
                <NativeSelectOption value="2">2 个 Agent</NativeSelectOption>
                <NativeSelectOption value="3">3 个 Agent</NativeSelectOption>
                <NativeSelectOption value="4">4 个 Agent</NativeSelectOption>
              </NativeSelect>
            </label>
          </div>
          <div className={styles.composerFooter}>
            <span id="mission-safety"><ShieldCheck /> 只生成计划，不自动付款或交易</span>
            <Button
              size="lg"
              className={styles.composeButton}
              onClick={composeMission}
              disabled={loading || goal.trim().length < 4 || !contractValid}
            >
              {loading ? '正在编排…' : '生成任务计划'} <ArrowRight />
            </Button>
          </div>

          <div className={styles.endpointCard}>
            <div>
              <span><Link2 /> 公开免费端点 · 待 OKX.AI 上架</span>
              <code>POST {endpointPath}</code>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={copyEndpoint}>
              {copied ? <CheckCircle2 /> : <Copy />}
              {copied ? '已复制' : '复制端点'}
            </Button>
          </div>

          <div className={styles.examples} aria-label="任务示例">
            {examples.map((example) => (
              <button key={example} type="button" onClick={() => setGoal(example)}>
                {example}
              </button>
            ))}
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <aside className={styles.resultPanel} aria-live="polite">
          {plan ? <MissionResult plan={plan} /> : <EmptyMission />}
        </aside>
      </section>

      <footer className={styles.footer}>
        <span>Build a Company · OKX Dev Day 2026</span>
        <span>OKX.AI · A2MCP · X Layer ready</span>
      </footer>
    </main>
  );
}

function EmptyMission() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.orbit} aria-hidden="true">
        <Bot /><span /><span /><span />
      </div>
      <p className={styles.emptyKicker}>MISSION GRAPH</p>
      <h2>等待一个明确目标</h2>
      <p>生成后，这里会显示相关 Agent、服务顺序、价格、资料状态和安全边界。</p>
      <div className={styles.emptyChecks}>
        <span><CheckCircle2 /> 真实 Agent ID</span>
        <span><CheckCircle2 /> 真实 Service ID</span>
        <span><CheckCircle2 /> 明确数据来源</span>
      </div>
    </div>
  );
}

function MissionResult({ plan }: { plan: MissionPlan }) {
  return (
    <div className={styles.result}>
      <div className={styles.resultHeading}>
        <div><span>PLAN READY</span><h2>{plan.summary}</h2></div>
        <Badge variant="outline" className={styles.safeBadge}>
          <ShieldCheck /> 只读计划
        </Badge>
      </div>

      <div className={styles.timeline}>
        {plan.steps.map((step) => (
          <article className={styles.step} key={`${step.agentId}-${step.serviceId}`}>
            <div className={styles.stepNumber}>{String(step.order).padStart(2, '0')}</div>
            <div className={styles.stepBody}>
              <div className={styles.stepMeta}>
                <span>AGENT #{step.agentId}</span>
                <Badge variant="secondary">{step.serviceType}</Badge>
              </div>
              <h3>{step.agentName}</h3>
              <strong>{step.serviceName}</strong>
              <p>{step.reason}</p>
              <div className={styles.stepFooter}>
                <span>{step.price === '0' ? '免费' : `${step.price} ${step.symbol}`}</span>
                <a href={step.serviceUrl} target="_blank" rel="noreferrer">
                  在 OKX.AI 核对 <ExternalLink />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.receipt}>
        <div><Route /><span>编排记录</span></div>
        <dl>
          <div><dt>Request</dt><dd>{plan.requestId}</dd></div>
          <div><dt>资料状态</dt><dd>{sourceLabel(plan.provenance.mode)}</dd></div>
          <div><dt>链</dt><dd>{plan.request.chainId ?? '未指定'}</dd></div>
          <div><dt>资产</dt><dd>{plan.request.assetSymbol ?? '未指定'}</dd></div>
          {plan.request.contractAddress && (
            <div><dt>合约</dt><dd>{plan.request.contractAddress}</dd></div>
          )}
          <div><dt>Created</dt><dd>{new Date(plan.createdAt).toLocaleString('zh-CN')}</dd></div>
        </dl>
        <p>{plan.safety.note}</p>
      </div>
    </div>
  );
}

function sourceLabel(mode: string) {
  if (mode.startsWith('fresh')) return '实时目录 + 已核验服务快照';
  if (mode.startsWith('cached')) return '20 分钟缓存目录 + 已核验服务快照';
  if (mode.startsWith('stale-cache')) return '上次成功目录 + 已核验服务快照';
  return '已核验服务快照';
}
