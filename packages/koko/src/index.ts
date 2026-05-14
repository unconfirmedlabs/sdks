// @unconfirmed/koko
//
// Sui SDK client extension that surfaces Koko's vendor RPC methods.
// v0.0.1 exposes `getCheckpoint` against Koko's historical archive
// (no ~30-day retention cliff). Batch reads will land in a follow-up
// once the Bundle/SigV4 plumbing is in place.
//
// Wire protocol (v0.0.1): JSON over HTTPS to https://api.koko.dev.
// Auth: `Authorization: Bearer <koko_live_...>` (passed via the
// `apiKey` option to `koko()`). Future versions will migrate to
// gRPC-Web; method signatures here are stable across that migration.
//
// Usage:
//   import { SuiGrpcClient } from '@mysten/sui/grpc';
//   import { koko } from '@unconfirmed/koko';
//
//   const client = new SuiGrpcClient({ network: 'mainnet' })
//     .$extend(koko({ apiKey: process.env.KOKO_API_KEY! }));
//
//   const cp = await client.koko.getCheckpoint({
//     sequenceNumber: 100_000n,
//     readMask: ['sequenceNumber', 'digest', 'summary'],
//   });

export { koko } from './extension';
export { KokoClient } from './client';
export type { KokoOptions, KokoExtension } from './extension';
export type {
  Checkpoint,
  CheckpointResult,
  GetCheckpointParams,
} from './types';
export type { KokoClientOptions } from './client';
export { KokoError } from './errors';
