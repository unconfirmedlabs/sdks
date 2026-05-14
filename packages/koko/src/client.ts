// KokoClient — REST-backed (JSON) client. v0.0.1.
//
// Wire protocol: HTTPS + JSON against https://api.koko.dev. The
// gateway transcodes to internal gRPC. A future v0.1.0 will speak
// gRPC-Web with proper proto codegen; the public method signatures
// here are stable across that migration.

import { KokoError } from './errors';
import type { RestCheckpoint } from './proto';
import type {
  Checkpoint,
  CheckpointResult,
  GetCheckpointParams,
} from './types';

const DEFAULT_BASE_URLS = {
  mainnet: 'https://api.koko.dev',
  testnet: 'https://testnet.api.koko.dev',
} as const;

export interface KokoClientOptions {
  /** Koko API key. Sent as `Authorization: Bearer <key>`. */
  apiKey?: string;
  /** Override the gateway base URL. */
  baseUrl?: string;
  /** Pick the default base URL for a Sui network. */
  network?: 'mainnet' | 'testnet';
  /** Custom fetch (e.g. for testing). Defaults to global fetch. */
  fetch?: typeof fetch;
}

export class KokoClient {
  readonly baseUrl: string;
  readonly #apiKey: string | undefined;
  readonly #fetch: typeof fetch;

  constructor(options: KokoClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(options);
    this.#apiKey = options.apiKey;
    this.#fetch = options.fetch ?? fetch;
  }

  async getCheckpoint(params: GetCheckpointParams): Promise<CheckpointResult> {
    const search = new URLSearchParams();
    if (params.readMask?.length) {
      search.set('read_mask', params.readMask.join(','));
    }
    const url = `${this.baseUrl}/v1/checkpoints/${params.sequenceNumber}${
      search.size > 0 ? `?${search}` : ''
    }`;
    try {
      const resp = await this.#fetch(url, { headers: this.#authHeaders() });
      if (resp.status === 404) return null;
      if (!resp.ok) throw await KokoError.fromResponse(resp, 'getCheckpoint');
      const body = (await resp.json()) as RestCheckpoint;
      return decodeCheckpoint(body);
    } catch (e) {
      throw KokoError.fromUnknown(e, 'getCheckpoint');
    }
  }

  #authHeaders(): Record<string, string> {
    return this.#apiKey ? { authorization: `Bearer ${this.#apiKey}` } : {};
  }
}

function decodeCheckpoint(raw: RestCheckpoint | undefined): Checkpoint | null {
  if (!raw) return null;
  if (raw.sequenceNumber == null || raw.digest == null) {
    return null;
  }
  const { sequenceNumber, digest, ...rest } = raw;
  return {
    sequenceNumber: BigInt(sequenceNumber),
    digest,
    raw: Object.keys(rest).length > 0 ? rest : undefined,
  };
}

function resolveBaseUrl(options: KokoClientOptions): string {
  if (options.baseUrl) return options.baseUrl.replace(/\/$/, '');
  const network = options.network ?? 'mainnet';
  return DEFAULT_BASE_URLS[network];
}
