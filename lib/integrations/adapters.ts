import type { AdapterResult, IntegrationManifest } from './types';
import { unavailable } from './types';
import { integrationById } from './catalog';

export type MetAgentRecord = {
  metAgentId: string;
  status: string;
};

export type TapeOutContainer = {
  chainId: number;
  processorAddress: string;
  circuitId: string;
  containerAddress: string;
  owner: string;
};

export type IgnixTokenRecord = Record<string, unknown> & {
  tokenAddress: string;
};

export interface MetAgentsAdapter {
  readonly manifest: IntegrationManifest;
  createMetAgent(input: unknown): Promise<AdapterResult<MetAgentRecord>>;
  getMetAgent(id: string): Promise<AdapterResult<MetAgentRecord>>;
  getMetAgentStatus(id: string): Promise<AdapterResult<string>>;
}

export interface TapeOutAdapter {
  readonly manifest: IntegrationManifest;
  createContainer(input: unknown): Promise<AdapterResult<TapeOutContainer>>;
  bindContainer(input: unknown): Promise<AdapterResult<TapeOutContainer>>;
  getContainer(input: unknown): Promise<AdapterResult<TapeOutContainer>>;
  verifyContainerOwner(input: unknown): Promise<AdapterResult<boolean>>;
  sendMessage(input: unknown): Promise<AdapterResult<{ txHash: string }>>;
  deployToDeWEB(input: unknown): Promise<AdapterResult<{ url: string }>>;
}

export interface IgnixAdapter {
  readonly manifest: IntegrationManifest;
  listLaunches(): Promise<AdapterResult<unknown>>;
  getAgentToken(tokenAddress: string): Promise<AdapterResult<IgnixTokenRecord>>;
  createAgentToken(input: unknown): Promise<AdapterResult<IgnixTokenRecord>>;
  configureDirectedVault(input: unknown): Promise<AdapterResult<never>>;
  getTreasury(input: unknown): Promise<AdapterResult<never>>;
  getRevenue(input: unknown): Promise<AdapterResult<never>>;
}

const metagents = integrationById('metagents');
const tapeout = integrationById('tapeout');
const ignix = integrationById('ignix');

if (!metagents || !tapeout || !ignix) {
  throw new Error('Integration catalog is incomplete.');
}

const metAgentsUnavailable = <T>() =>
  unavailable<T>(
    'NOT_CONNECTED',
    'MetAgents has not published a supported create/read Agent API or SDK. Use the hosted product until a public developer contract exists.',
  );

export const metAgentsAdapter: MetAgentsAdapter = {
  manifest: metagents,
  async createMetAgent() {
    return metAgentsUnavailable();
  },
  async getMetAgent() {
    return metAgentsUnavailable();
  },
  async getMetAgentStatus() {
    return metAgentsUnavailable();
  },
};

const tapeOutExternal = <T>(operation: string) =>
  unavailable<T>(
    'EXTERNAL_ONLY',
    `${operation} is not connected. TapeOut's official product is the only accepted surface until stable X Layer addresses, ABI and API/SDK documentation are published.`,
  );

export const tapeOutAdapter: TapeOutAdapter = {
  manifest: tapeout,
  async createContainer() {
    return tapeOutExternal('createContainer');
  },
  async bindContainer() {
    return unavailable(
      'NOT_CONNECTED',
      'TapeOut does not currently document a protocol-native Agent-to-Container binding.',
    );
  },
  async getContainer() {
    return tapeOutExternal('getContainer');
  },
  async verifyContainerOwner() {
    return tapeOutExternal('verifyContainerOwner');
  },
  async sendMessage() {
    return unavailable(
      'NOT_CONNECTED',
      'TapeSend has no verified public API, SDK or ABI in the current audit.',
    );
  },
  async deployToDeWEB() {
    return unavailable(
      'NOT_CONNECTED',
      'No supported DeWEB deploy API or SDK for X Layer is published.',
    );
  },
};

const IGNIX_API = 'https://api.ignix.bot';
const addressPattern = /^0x[\da-fA-F]{40}$/;

async function readIgnix(path: string): Promise<AdapterResult<unknown>> {
  try {
    const response = await fetch(IGNIX_API + path, {
      signal: AbortSignal.timeout(12000),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      return {
        ok: false,
        code: 'UPSTREAM_ERROR',
        message: `Ignix read API returned HTTP ${response.status}.`,
        retryable: response.status >= 500,
      };
    }
    const payload = (await response.json()) as { code?: number };
    if (payload?.code !== 200) {
      return {
        ok: false,
        code: 'UPSTREAM_ERROR',
        message:
          'Ignix read API did not return a successful protocol response.',
        retryable: true,
      };
    }
    return {
      ok: true,
      data: payload,
      source: IGNIX_API + path,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      ok: false,
      code: 'UPSTREAM_ERROR',
      message: 'Ignix read API is temporarily unavailable.',
      retryable: true,
    };
  }
}

export const ignixAdapter: IgnixAdapter = {
  manifest: ignix,
  async listLaunches() {
    return readIgnix('/v1/launches');
  },
  async getAgentToken(tokenAddress) {
    if (!addressPattern.test(tokenAddress)) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        message: 'tokenAddress must be a 20-byte 0x-prefixed EVM address.',
        retryable: false,
      };
    }
    const result = await readIgnix(
      '/v1/launches/' + tokenAddress.toLowerCase(),
    );
    if (!result.ok) return result;
    const payload = result.data as { data?: IgnixTokenRecord };
    if (!payload.data || !addressPattern.test(payload.data.tokenAddress)) {
      return {
        ok: false,
        code: 'UPSTREAM_ERROR',
        message: 'Ignix returned an invalid token record.',
        retryable: true,
      };
    }
    return { ...result, data: payload.data };
  },
  async createAgentToken() {
    return unavailable(
      'EXTERNAL_ONLY',
      'Token launch requires Ignix platform authorization and a wallet transaction. No supported third-party launch API is connected.',
    );
  },
  async configureDirectedVault() {
    return unavailable(
      'EXTERNAL_ONLY',
      'Directed Vault recipient selection is part of the Ignix launch flow and is immutable after launch.',
    );
  },
  async getTreasury() {
    return unavailable(
      'NOT_CONNECTED',
      'Agent Treasury is not a single documented Ignix value. Define the treasury address and onchain accounting source first.',
    );
  },
  async getRevenue() {
    return unavailable(
      'NOT_CONNECTED',
      'Verified Agent revenue, Vault tax and Treasury balance require separate onchain accounting adapters.',
    );
  },
};
