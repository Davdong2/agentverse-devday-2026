'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ExternalLink,
  Network,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        },
        required: ['goal'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input) {
        if (!input || typeof input !== 'object') throw new Error('需要任务目标。');
        const value = input as { goal?: unknown; maxAgents?: unknown };
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
          maxAgents: 3,
          riskMode: 'confirm-before-action',
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
            <Radio /> A2MCP FREE ENDPOINT
          </Badge>
          <Link className={styles.worldLink} href="/world">
            进入可视化世界 <ArrowRight />
          </Link>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.composer}>
          <div className={styles.eyebrow}><Sparkles /> 新任务</div>
          <h1>把目标交给一组<br />真正可核对的 Agent</h1>
          <p className={styles.intro}>
            输入一个目标。Agentverse 会从 OKX.AI 服务资料中选择合适的能力，返回带 Agent ID、Service ID、价格和来源的执行计划。
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
          <div className={styles.composerFooter}>
            <span id="mission-safety"><ShieldCheck /> 只生成计划，不自动付款或交易</span>
            <Button
              size="lg"
              className={styles.composeButton}
              onClick={composeMission}
              disabled={loading || goal.trim().length < 4}
            >
              {loading ? '正在编排…' : '生成任务计划'} <ArrowRight />
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
      <p>生成后，这里会显示可核对的 Agent、服务顺序、价格和安全边界。</p>
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
        <div><span>MISSION READY</span><h2>{plan.summary}</h2></div>
        <Badge variant="outline" className={styles.safeBadge}>
          <ShieldCheck /> SAFE PLAN
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
        <div><Route /><span>执行收据</span></div>
        <dl>
          <div><dt>Request</dt><dd>{plan.requestId}</dd></div>
          <div><dt>Source</dt><dd>{plan.provenance.mode}</dd></div>
          <div><dt>Created</dt><dd>{new Date(plan.createdAt).toLocaleString('zh-CN')}</dd></div>
        </dl>
        <p>{plan.safety.note}</p>
      </div>
    </div>
  );
}
