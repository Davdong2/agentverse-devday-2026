'use client';
import { useState, type CSSProperties } from 'react';
import {
  ArrowUpRight,
  ArrowLeft,
  Search,
  ShieldCheck,
  ChartNoAxesColumnIncreasing,
  Database,
  Sparkles,
  Leaf,
  Code2,
  CircleCheck,
} from 'lucide-react';
import { SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AgentSprite } from '@/components/world-scene';
import { agentDesigns, agentVariant } from '@/lib/agent-design';
import { appearance } from '@/lib/world-model';
import {
  regions,
  stages,
  stageAt,
  regionFor,
  type AgentState,
  type MemoryRecord,
} from '@/lib/civilization-model';
import type { Agent, AgentData, Detail } from '@/lib/marketplace';
const icons = [
  Search,
  ChartNoAxesColumnIncreasing,
  ShieldCheck,
  CircleCheck,
  Database,
  Sparkles,
  Leaf,
  Code2,
];
const sequence = [
  '发出请求',
  '伙伴靠近',
  '连接能力',
  '开始工作',
  '生成结果',
  '拆分成长',
];
const phaseMap = [0, 1, 2, 3, 3, 4, 4, 5, 5];
export default function AgentDossier({
  agent,
  data,
  service,
  serviceNotice,
  time,
  state,
  memories,
  team,
  onSelect,
  onDirectory,
}: {
  agent: Agent;
  data: AgentData;
  service: Detail | null;
  serviceNotice: string;
  time: number;
  state?: AgentState;
  memories: MemoryRecord[];
  team: Agent[];
  onSelect: (a: Agent) => void;
  onDirectory: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const variant = state?.variant ?? agentVariant(agent),
    design = agentDesigns[variant],
    Icon = icons[variant];
  const visual = appearance(agent, service ?? undefined);
  const currentStage = stageAt(time),
    collab = !!state?.collaborator;
  const closestRegion = state
    ? regions.reduce(
        (best, r, i) =>
          Math.hypot(r.x - state.x, r.y - state.y) <
          Math.hypot(regions[best].x - state.x, regions[best].y - state.y)
            ? i
            : best,
        0,
      )
    : regionFor(agent, service ?? undefined);
  const activity = state?.activity ?? '等待世界状态';
  const services = service?.services ?? [];
  const activeStep = collab ? phaseMap[currentStage] : -1;
  const abilities = visual.modules.length
    ? visual.modules
    : [design.name + '能力'];
  return (
    <div
      className="agent-dossier"
      style={{ '--agent-accent': design.color } as CSSProperties}
    >
      <header className="dossier-top">
        <button onClick={onDirectory}>
          <ArrowLeft size={16} />
          全部 Agent
        </button>
        <span>
          AGENTVERSE <i> / </i> 数字生命档案
        </span>
        <span className="dossier-mode">
          资料 {data.mode === 'fresh' ? 'LIVE' : '缓存'} · 行为 Demo
        </span>
      </header>
      <aside className="dossier-left">
        <section className="dossier-card identity-card">
          <small>OKX.AI · AGENT #{agent.agentId}</small>
          <SheetTitle>{agent.name}</SheetTitle>
          <SheetDescription>
            {agent.categoryName.join(' · ')} · {design.name}型分身
          </SheetDescription>
          <p className="dossier-intro">{agent.description}</p>
          <div className="dossier-tags">
            <span>来自 OKX.AI</span>
            <span>{design.name}型</span>
            <span>{design.bodyName}</span>
          </div>
          <dl className="dossier-metrics">
            <div>
              <dd>{agent.score || '—'}</dd>
              <dt>评分</dt>
            </div>
            <div>
              <dd>{agent.usageCount.toLocaleString()}</dd>
              <dt>销量</dt>
            </div>
            <div>
              <dd>{agent.startingPrice || '—'}</dd>
              <dt>
                {agent.symbol} / {agent.priceInterval || '次'}起
              </dt>
            </div>
          </dl>
          <a
            className="dossier-cta"
            href={'https://www.okx.ai/zh-hans/agents/' + agent.agentId}
            target="_blank"
            rel="noreferrer"
          >
            和我一起工作 <ArrowUpRight size={16} />
          </a>
          <small className="dossier-source">前往 OKX.AI 查看服务与价格</small>
        </section>
        <section className="dossier-card services-card">
          <h3>我能做什么</h3>
          <p className="dossier-muted">
            {serviceNotice || '公开服务资料'} · {services.length} /{' '}
            {service?.total ?? 0}
          </p>
          {(showAll ? services : services.slice(0, 3)).map((s) => (
            <article className="dossier-service" key={s.serviceId}>
              <Icon size={21} />
              <div>
                <h4>{s.name}</h4>
                <p>{s.description}</p>
                <strong>
                  {s.price} {s.symbol}
                  {s.priceInterval ? ' / ' + s.priceInterval : ''}
                </strong>
              </div>
            </article>
          ))}
          {!services.length && (
            <p className="dossier-muted">
              暂未取得服务明细，可前往来源页面查看。
            </p>
          )}
          {services.length > 3 && (
            <button
              className="dossier-text-button"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? '收起服务' : '查看全部服务 (' + services.length + ')'}
            </button>
          )}
        </section>
      </aside>
      <section
        className="dossier-center"
        aria-label={agent.name + '的场景形象'}
      >
        <div className="agent-thought">
          <span className="demo-dot" /> {activity}
          <small>演示分身的当前状态</small>
        </div>
        <div
          className="dossier-character"
          style={{ transform: `translateY(${Math.sin(time * 2) * 4}px)` }}
        >
          <AgentSprite role={visual.role} variant={variant} />
        </div>
        <div className="dossier-capabilities">
          {abilities.map((name, i) => (
            <div key={name}>
              <span
                style={{ background: agentDesigns[(variant + i) % 8].color }}
              >
                <Icon size={22} />
              </span>
              <b>
                {name}
                <small>根据公开介绍归类</small>
              </b>
            </div>
          ))}
        </div>
        <div className="dossier-nameplate">
          <strong>{agent.name}</strong>
          <span>
            <i />
            {collab ? '正在协作' : '正在世界中活动'} · Demo
          </span>
        </div>
      </section>
      <aside className="dossier-right">
        <section className="dossier-card">
          <h3>
            当前状态 <span className="dossier-demo">Demo</span>
          </h3>
          <dl className="dossier-status">
            <div>
              <dt>当前动作</dt>
              <dd>{activity}</dd>
            </div>
            <div>
              <dt>所在区域</dt>
              <dd>{regions[closestRegion].name}</dd>
            </div>
            <div>
              <dt>协作伙伴</dt>
              <dd>
                {collab ? '与 ' + (team.length - 1) + ' 个 Agent' : '独立活动'}
              </dd>
            </div>
            <div>
              <dt>名录状态</dt>
              <dd>
                {agent.onlineStatus === 1 ? '在线' : '未标记在线'}{' '}
                <small>来源资料</small>
              </dd>
            </div>
          </dl>
        </section>
        <section className="dossier-card">
          <h3>
            最近活动 <span className="dossier-demo">Demo</span>
          </h3>
          <div className="dossier-activity">
            <p>
              <i />
              {activity}
              <small>此刻</small>
            </p>
            {memories.slice(0, 3).map((m) => (
              <p key={m.cycle}>
                <i />
                {m.result}
                <small>协作循环 #{m.cycle}</small>
              </p>
            ))}
          </div>
          {!memories.length && (
            <p className="dossier-muted">尚无已完成的协作记录。</p>
          )}
          {collab && (
            <div className="dossier-partners">
              {team
                .filter((a) => a.agentId !== agent.agentId)
                .map((a) => (
                  <button key={a.agentId} onClick={() => onSelect(a)}>
                    {a.name}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
            </div>
          )}
        </section>
        <section className="dossier-card">
          <h3>公开评价</h3>
          <div className="dossier-rating">
            {agent.score || '—'} <span>评分</span>
          </div>
          <p>好评率 {agent.approvalRate || '暂无'}</p>
          <p className="dossier-muted">暂未接入评论正文。</p>
          <small className="dossier-source">
            资料同步于{' '}
            {new Date(data.fetchedAt).toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
            })}
          </small>
        </section>
      </aside>
      <section className="dossier-cooperation">
        <div className="dossier-coop-heading">
          <h3>协作中的 {agent.name}</h3>
          <span>
            {collab ? '同一世界 · 正在进行' : '能力协作流程示意'} · Demo
          </span>
        </div>
        <ol>
          {sequence.map((name, i) => (
            <li key={name} aria-current={activeStep === i ? 'step' : undefined}>
              <div className="dossier-step-art">
                <AgentSprite
                  role={visual.role}
                  variant={i === 1 ? 2 : variant}
                />
                {i >= 2 && i < 5 && (
                  <AgentSprite role={0} variant={i === 4 ? 1 : 2} />
                )}
              </div>
              <strong>
                <b>{i + 1}</b>
                {name}
              </strong>
              <small>
                {
                  [
                    '提出所需能力',
                    '伙伴响应请求',
                    '组合能力模块',
                    '分析 · 检查 · 执行',
                    '交付结果核心',
                    '能力回归个体',
                  ][i]
                }
              </small>
            </li>
          ))}
        </ol>
        <p className="dossier-muted">
          {collab
            ? stages[currentStage].note
            : '此分身当前独立活动，上方流程仅说明协作方式。'}
        </p>
      </section>
    </div>
  );
}
