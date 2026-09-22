export type IntegrationStatus =
  | 'connected-read'
  | 'external-only'
  | 'not-connected';

export type CapabilityStatus = 'verified' | 'external-only' | 'not-connected';

export type CapabilityMode = 'read' | 'write' | 'sign' | 'message' | 'deploy';

export type IntegrationSource = {
  id: string;
  label: string;
  url: string;
  kind: 'official-docs' | 'official-product' | 'official-api' | 'onchain';
};

export type ContractReference = {
  name: string;
  network: string;
  address: string | null;
  status: 'verified' | 'not-published';
  abi: 'documented-fragments' | 'not-published';
  notes: string;
};

export type IntegrationCapability = {
  id: string;
  label: string;
  mode: CapabilityMode;
  status: CapabilityStatus;
  authentication: string;
  notes: string;
  sourceIds: string[];
};

export type AuditCheck = {
  label: string;
  result: string;
  status: 'passed' | 'not-run' | 'blocked';
};

export type IntegrationManifest = {
  id: 'metagents' | 'tapeout' | 'ignix';
  name: string;
  proposedRole: string;
  verifiedRole: string;
  status: IntegrationStatus;
  summary: string;
  sdk: string;
  api: string;
  authentication: string;
  limitations: string[];
  capabilities: IntegrationCapability[];
  contracts: ContractReference[];
  checks: AuditCheck[];
  sources: IntegrationSource[];
};

export type AdapterFailureCode =
  | 'NOT_CONNECTED'
  | 'EXTERNAL_ONLY'
  | 'INVALID_INPUT'
  | 'UPSTREAM_ERROR';

export type AdapterResult<T> =
  | {
      ok: true;
      data: T;
      source: string;
      checkedAt: string;
    }
  | {
      ok: false;
      code: AdapterFailureCode;
      message: string;
      retryable: boolean;
    };

export function unavailable<T>(
  code: Extract<AdapterFailureCode, 'NOT_CONNECTED' | 'EXTERNAL_ONLY'>,
  message: string,
): AdapterResult<T> {
  return { ok: false, code, message, retryable: false };
}
