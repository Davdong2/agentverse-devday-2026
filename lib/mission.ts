export type MissionStep = {
  order: number;
  agentId: string;
  agentName: string;
  serviceId: number;
  serviceName: string;
  serviceType: string;
  price: string;
  symbol: string;
  reason: string;
  role: string;
  capabilities: string[];
  dependsOn: number[];
  serviceUrl: string;
};

export type ComposedMission = {
  goal: string;
  summary: string;
  steps: MissionStep[];
  request: {
    maxAgents: number;
    riskMode: 'confirm-before-action';
    assetSymbol?: string;
    chainId?: string;
    contractAddress?: string;
  };
  provenance: {
    source: string;
    fetchedAt: string;
    mode: string;
  };
  safety: {
    automaticPayment: false;
    automaticExecution: false;
    note: string;
  };
};

export type MissionPlan = ComposedMission & {
  requestId: string;
  createdAt: string;
};

export const activeMissionStorageKey = 'agentverse.active-mission.v1';

export function isMissionPlan(value: unknown): value is MissionPlan {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const plan = value as Partial<MissionPlan>;
  return (
    typeof plan.requestId === 'string' &&
    typeof plan.createdAt === 'string' &&
    typeof plan.goal === 'string' &&
    Array.isArray(plan.steps) &&
    plan.steps.length > 0 &&
    plan.steps.every(
      (step) =>
        step &&
        typeof step.agentId === 'string' &&
        typeof step.agentName === 'string' &&
        typeof step.serviceId === 'number',
    )
  );
}
