'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Orbit,
  ArrowUpRight,
  Compass,
  ShieldCheck,
  RefreshCw,
  Pause,
  Download,
  ArrowLeftRight,
  ScanLine,
  CircleCheck,
  Play,
  Camera,
  Globe2,
} from 'lucide-react';
import WorldScene, { AgentSprite } from '@/components/world-scene';
import { appearance, stateNames, replayState } from '@/lib/world-model';
import snapshot from '@/lib/agents.json';
import detailsSnapshot from '@/lib/details.json';
import {
  areas,
  type AgentData,
  type Detail,
  type Agent,
} from '@/lib/marketplace';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const nodes = [
  { name: '研究台', en: 'RESEARCH', x: 18.5, y: 28, Icon: ScanLine },
  { name: '风险门', en: 'VERIFICATION', x: 39, y: 24, Icon: ShieldCheck },
  { name: '交易塔', en: 'EXECUTION', x: 62, y: 23, Icon: ArrowLeftRight },
  { name: '结算桥', en: 'SETTLEMENT', x: 85, y: 57, Icon: CircleCheck },
];
export default function Home() {
  const [data, setData] = useState<AgentData>({
    ...snapshot,
    mode: 'snapshot',
  });
  const [node, setNode] = useState(0);
  const [id, setId] = useState('2083');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replayStarted, setReplayStarted] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [photo, setPhoto] = useState(false);
  const [photoConfigured, setPhotoConfigured] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUncertain, setPhotoUncertain] = useState(false);
  useEffect(() => {
    if (!photo) return;
    fetch('/api/photographs')
      .then((r) => r.json() as Promise<{ configured: boolean }>)
      .then((d) => setPhotoConfigured(d.configured))
      .catch(() => setPhotoConfigured(false));
  }, [photo]);
  const [services, setServices] = useState<Detail | null>(
    (detailsSnapshot as Record<string, Detail>)['2083'],
  );
  const [serviceStatus, setServiceStatus] = useState('');
  const [panelTab, setPanelTab] = useState('profile');
  const agent = data.agents.find((a) => a.agentId === id) ?? data.agents[0];
  const visual = appearance(agent, services);
  const worldState = replayStarted ? replayState(progress) : 'idle';
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/agents');
      if (!r.ok) throw new Error();
      const d = (await r.json()) as AgentData;
      if (!Array.isArray(d.agents) || !d.agents.length) throw new Error();
      setData(d);
      setNotice(
        d.mode === 'snapshot'
          ? (d.message ?? '正在显示已保存的真实资料')
          : '资料已更新',
      );
    } catch {
      setNotice('同步暂不可用，已保留当前真实资料。');
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 1200000);
    return () => clearInterval(t);
  }, [refresh]);
  useEffect(() => {
    const c = new AbortController();
    setServices(
      (detailsSnapshot as Record<string, Detail>)[agent.agentId] ?? null,
    );
    setServiceStatus('正在核对服务资料');
    fetch('/api/agents/' + agent.agentId, { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<Detail>;
      })
      .then((d) => {
        setServices(d);
        setServiceStatus(
          d.mode === 'snapshot' ? '显示已保存的真实服务' : '服务资料已核对',
        );
      })
      .catch(() => {
        if (!c.signal.aborted)
          setServiceStatus('服务同步暂不可用，可查看原始页面');
      });
    return () => c.abort();
  }, [agent.agentId]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => setProgress((p) => Math.min(1, p + 0.005)),
      100,
    );
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (!replayStarted) return;
    setNode(
      progress < 5 / 16 ? 0 : progress < 10 / 16 ? 1 : progress < 1 ? 2 : 3,
    );
    if (progress >= 1) setPlaying(false);
  }, [progress, replayStarted]);
  const selectAgent = useCallback((a: Agent) => {
    setId(a.agentId);
    setNode(
      appearance(a, (detailsSnapshot as Record<string, Detail>)[a.agentId])
        .home,
    );
    setPlaying(false);
    setReplayStarted(false);
    setProgress(0);
  }, []);
  const selectNode = (i: number) => {
    const a = data.agents.find(
      (a) =>
        appearance(a, (detailsSnapshot as Record<string, Detail>)[a.agentId])
          .home === i,
    );
    if (a) selectAgent(a);
    setNode(i);
  };
  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (progress >= 1 || !replayStarted) setProgress(0);
    setReplayStarted(true);
    setPlaying(true);
  };
  const scene = {
    world: 'Agentverse',
    version: '0.1',
    capturedAt: new Date().toISOString(),
    source: data.source,
    sourceFetchedAt: data.fetchedAt,
    agent: {
      id: agent.agentId,
      name: agent.name,
      category: agent.categoryName,
    },
    node: areas[node].name,
    state: stateNames[worldState],
    visual,
    agents: data.agents.map((a) => ({
      id: a.agentId,
      name: a.name,
      visual: appearance(
        a,
        (detailsSnapshot as Record<string, Detail>)[a.agentId],
      ),
    })),
    behavior: 'demonstration_only',
    verifiedTransaction: null,
    prompt: `原创极简等距几何叙事空间，米白哑光陶瓷建筑、雾蓝背景、薄荷绿验证门与暖金资产核心。小型非人类 Agent ${agent.name} 位于${areas[node].name}，展示${stateNames[worldState]}动作。留白，柔和自然光，不使用职业服装、霓虹、HUD 或品牌 Logo。此为行为概念演示，不代表真实任务或链上记录。`,
  };
  async function generatePhoto() {
    if (photoBusy || photoUncertain) return;
    setPhotoBusy(true);
    setPhotoError('');
    setPhotoUrl('');
    const requestId = crypto.randomUUID();
    try {
      const r = await fetch('/api/photographs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          agentId: agent.agentId,
          node,
          state: worldState,
        }),
      });
      const result = (await r.json()) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (!r.ok) {
        if (
          result.code === 'uncertain' ||
          result.code === 'already_requested'
        ) {
          setPhotoUncertain(true);
          setPhotoUrl(result.url ?? '');
        }
        throw new Error(result.error ?? '生成未成功');
      }
      setPhotoUrl(result.url ?? '');
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : '生成连接中断');
      if (!(e instanceof Error) || e.message === 'Failed to fetch') {
        setPhotoUncertain(true);
        setPhotoUrl('/api/photographs/' + requestId);
      }
    } finally {
      setPhotoBusy(false);
    }
  }
  function downloadScene() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentverse-' + agent.agentId + '-scene.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => unknown;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const c = new AbortController();
    try {
      Promise.resolve(
        ctx.registerTool(
          {
            name: 'select_agent',
            title: '查看 Agent',
            description:
              '选择真实名录中的 Agent 并显示对应资料；不调用服务或交易。',
            inputSchema: {
              type: 'object',
              properties: { agentId: { type: 'string' } },
              required: ['agentId'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input: unknown) => {
              const x = input as { agentId?: unknown };
              if (!x || typeof x.agentId !== 'string')
                throw new Error('需要 Agent ID');
              const a = data.agents.find((a) => a.agentId === x.agentId);
              if (!a) throw new Error('Agent 不在当前名录');
              selectAgent(a);
              await new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              );
              return {
                agentId: a.agentId,
                name: a.name,
                node: areas[
                  appearance(
                    a,
                    (detailsSnapshot as Record<string, Detail>)[a.agentId],
                  ).home
                ].name,
                source: data.source,
              };
            },
          },
          { signal: c.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => c.abort();
  }, [data, selectAgent]);
  return (
    <main>
      <header className="masthead">
        <a className="brand" href="/">
          <Orbit size={30} />
          <b>AGENTVERSE</b>
          <span>创世季 001</span>
        </a>
        <nav>
          <a className="active" href="#world">
            探索世界
          </a>
          <a href="#agents">Agent 名录</a>
        </nav>
        <a
          className="market-link"
          href={data.source}
          target="_blank"
          rel="noreferrer"
        >
          OKX.AI <ArrowUpRight size={16} />
        </a>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">A WORLD OF AUTONOMOUS AGENTS</p>
          <h1>每一次行动，都有迹可循。</h1>
          <p className="subtitle">
            走进 Agent 的世界，看见研究、协作与价值的流动。
          </p>
        </div>
        <div className="world-count">
          <b>
            {data.agents.length}
            <span> / {data.total}</span>
          </b>
          <span>已映射 Agent / 市场总数</span>
        </div>
      </section>
      <section className="workspace" id="world">
        <div className="world">
          <div className="world-top">
            <span>
              <Globe2 size={16} /> 初始之境 <i>GENESIS</i>
            </span>
            <span className="pill">真实名录 · 行为演示</span>
          </div>
          <div className="map-viewport">
            <div className={'map ' + (zoom ? 'zoomed' : '')}>
              <img
                src="/world.webp"
                alt="研究台、薄荷色风险门、金色交易塔与结算桥组成的悬浮等距世界"
              />
              {nodes.map((n, i) => (
                <button
                  key={n.name}
                  style={{ left: n.x + '%', top: n.y + '%' }}
                  className={'hotspot ' + (i === node ? 'selected' : '')}
                  onClick={() => selectNode(i)}
                >
                  <n.Icon size={16} />
                  <span>{n.name}</span>
                  <small>0{i + 1}</small>
                </button>
              ))}
              <WorldScene
                agents={data.agents}
                details={detailsSnapshot as Record<string, Detail>}
                selectedId={agent.agentId}
                progress={progress}
                active={replayStarted}
                state={worldState}
                onSelect={selectAgent}
                onNode={selectNode}
              />
            </div>
          </div>
          <div className="world-bottom">
            <span>
              <Compass size={16} /> 点击角色，查看真实资料
            </span>
            <button
              className="camera-button"
              aria-pressed={zoom}
              onClick={() => setZoom(!zoom)}
            >
              {zoom ? '− 缩小' : '+ 放大'}
            </button>
            <button
              className="camera-button"
              onClick={() => {
                setPlaying(false);
                setPhoto(true);
              }}
            >
              <Camera size={15} /> 场景摄影
            </button>
          </div>
        </div>
        <aside className="inspector">
          <div className="panel-label">
            AGENT PROFILE <span>↗</span>
          </div>
          <div className="identity">
            <img src={agent.avatar} alt="" />
            <div>
              <span className="eyebrow">
                {agent.categoryName[0]} · #{agent.agentId}
              </span>
              <h2>{agent.name}</h2>
            </div>
          </div>
          <span className="status">
            <span />{' '}
            {agent.onlineStatus === 1 ? '来源页面显示在线' : '来源未确认在线'}
          </span>
          <Tabs value={panelTab} onValueChange={(v) => setPanelTab(String(v))}>
            <TabsList variant="line" className="profile-tabs">
              <TabsTrigger value="profile">身份与能力</TabsTrigger>
              <TabsTrigger value="services">
                真实服务 {services?.total ?? ''}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <p className="description">{agent.description}</p>
              <div className="capability-modules">
                {visual.modules.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
              <div className="visual-profile">
                <AgentSprite role={visual.role} />
                <div>
                  <b>{visual.organ}</b>
                  <p>
                    信誉光环 {visual.reputation}/3 · 热度{' '}
                    {Math.round(visual.heat * 100)}%
                  </p>
                  <small>由公开资料映射，不是平台等级</small>
                </div>
              </div>
              <div className="metrics">
                <div>
                  <b>{agent.score ?? '—'}</b>
                  <span>市场评分</span>
                </div>
                <div>
                  <b>{agent.usageCount.toLocaleString()}</b>
                  <span>总已售</span>
                </div>
                <div>
                  <b>{agent.approvalRate}</b>
                  <span>好评率</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="services">
              <p className="service-status">{serviceStatus}</p>
              <div className="service-list">
                {services?.services.map((s) => (
                  <div className="service-item" key={s.serviceId}>
                    <b>{s.name}</b>
                    <span>
                      {s.price} {s.symbol}/
                      {s.priceInterval === 'month' ? '月' : '次'}
                    </span>
                    <details>
                      <summary>服务说明</summary>
                      <p>{s.description}</p>
                    </details>
                  </div>
                ))}
                {!services && <p>服务信息加载中，可通过下方链接查看。</p>}
              </div>
              {services && (
                <p className="service-status">
                  展示来源页面首批 {services.services.length} 项 / 共{' '}
                  {services.total} 项
                </p>
              )}
            </TabsContent>
          </Tabs>
          <div className="section-label">市场列表展示起价</div>
          <div className="price">
            <b>{agent.startingPrice}</b> USDT{' '}
            <span>/ {agent.priceInterval === 'month' ? '月' : '次'}起</span>
          </div>
          <a
            className="primary-link"
            href={'https://www.okx.ai/zh-hans/agents/' + agent.agentId}
            target="_blank"
            rel="noreferrer"
          >
            查看真实服务 <ArrowUpRight size={17} />
          </a>
          <div className="source-note">
            资料来自 OKX.AI 公开页面
            <br />
            <span className="data-mode">
              {data.mode === 'snapshot'
                ? '已保存资料 · 非实时'
                : '近期同步资料'}
            </span>
            <br />
            <time>
              {new Date(data.fetchedAt).toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                hour12: false,
              })}
              （北京时间）
            </time>
            <br />
            世界位置是能力映射，不代表实际执行状态。
          </div>
        </aside>
      </section>
      <section className="journey">
        <div>
          <p className="eyebrow">FOLLOW THE FLOW</p>
          <h2>一次任务的旅程</h2>
          <p>行为演示 · 不执行真实交易</p>
          <button className="play-button" onClick={play}>
            {playing ? <Pause size={14} /> : <Play size={14} />}{' '}
            {playing ? '暂停演示' : progress >= 1 ? '重新回放' : '播放旅程'}
          </button>
        </div>
        <div className="flow-main">
          <div className="steps">
            {nodes.map((n, i) => (
              <button
                className={i === node ? 'current' : ''}
                onClick={() => selectNode(i)}
                key={n.name}
              >
                <span className="step-icon">
                  <n.Icon size={19} />
                </span>
                <span>
                  <small>0{i + 1}</small>
                  <b>{['发现机会', '风险检查', '执行任务', '确认交付'][i]}</b>
                </span>
              </button>
            ))}
          </div>
          <p className="flow-note" aria-live="polite">
            <b>{areas[node].name}</b>
            <span>{areas[node].note}</span>
            <span className="state-badge">{stateNames[worldState]}</span>
            <small>
              {playing ? '演示进行中' : progress >= 1 ? '演示完成' : '节点预览'}
            </small>
          </p>
        </div>
      </section>
      <section className="directory" id="agents">
        <div className="directory-heading">
          <div>
            <p className="eyebrow">THE INHABITANTS</p>
            <h2>
              认识这里的 Agent <span>{data.agents.length}</span>
            </h2>
          </div>
          <div className="sync-control">
            <button onClick={() => void refresh()} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              {refreshing ? '正在同步' : '同步名录'}
            </button>
            <span role="status">
              {notice || '每 20 分钟核对 · 首批公开名录'}
            </span>
          </div>
        </div>
        <div className="agent-grid">
          {data.agents.map((a) => (
            <button
              className={'agent-card ' + (id === a.agentId ? 'chosen' : '')}
              onClick={() => {
                selectAgent(a);
                document
                  .getElementById('world')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              key={a.agentId}
            >
              <img loading="lazy" src={a.avatar} alt="" />
              <div>
                <h3>{a.name}</h3>
                <p>
                  {a.categoryName[0]} · {a.score ?? '暂无'} 评分
                </p>
              </div>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      </section>
      <footer>
        <span>
          AGENTVERSE <small>让自主行为成为可见的世界</small>
        </span>
        <span>基于 X Layer / OKX.AI · 独立概念原型</span>
      </footer>
      <Dialog
        open={photo}
        onOpenChange={(open) => {
          if (!photoBusy) setPhoto(open);
        }}
      >
        <DialogContent className="scene-dialog">
          <DialogTitle>留住此刻的世界</DialogTitle>
          <DialogDescription>
            保存当前
            Agent、节点和动作，用于后续高清重绘。当前导出包含场景描述与视觉提示词。
          </DialogDescription>
          <img
            src={photoUrl && !photoUncertain ? photoUrl : '/world.webp'}
            alt={
              photoUrl && !photoUncertain
                ? '按当前场景生成的纪念图'
                : '当前世界视觉锚点'
            }
          />
          <div className="scene-meta">
            <span>{agent.name}</span>
            <span>{areas[node].name} · 行为演示</span>
          </div>
          <p className="scene-prompt">{scene.prompt}</p>
          <button
            className="primary-link"
            disabled={!photoConfigured || photoBusy || photoUncertain}
            onClick={() => void generatePhoto()}
          >
            {photoBusy ? '正在生成，请稍候…' : '生成高清纪念图'}{' '}
            <Camera size={16} />
          </button>
          {photoError && (
            <p role="alert" className="photo-error">
              {photoError}
            </p>
          )}
          {photoUrl && (
            <a
              className="photo-result"
              href={photoUrl}
              download={!photoUncertain}
            >
              {photoUncertain ? '查看已提交的生成结果' : '下载高清纪念图'}{' '}
              <Download size={16} />
            </a>
          )}
          <button className="secondary-export" onClick={downloadScene}>
            导出场景描述 <Download size={16} />
          </button>
          <p className="service-status">
            {photoConfigured
              ? '生成会使用已配置图片服务的额度。每次生成 1 张，2048 × 1152。'
              : '尚未配置图片生成服务。场景描述可以正常导出，配置完成后即可生成新图片。'}
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
