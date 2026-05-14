// Public TypeScript surface for the SDK extension.

export interface Checkpoint {
  sequenceNumber: bigint;
  digest: string;
  /**
   * Opaque pass-through for fields the SDK doesn't model yet (summary,
   * signature, contents, transactions, objects). Decode with
   * @mysten/sui's checkpoint types if you need them.
   */
  raw?: Record<string, unknown>;
}

export type CheckpointResult = Checkpoint | null;

export interface GetCheckpointParams {
  /** Sequence number to fetch. */
  sequenceNumber: bigint;
  /**
   * Field paths to populate on the returned Checkpoint. Defaults to
   * `['sequenceNumber', 'digest']`, matching the fullnode default.
   */
  readMask?: string[];
}
