// Wire shapes for the Koko REST surface (v0.0.1).
//
// JSON over HTTPS to https://api.koko.dev. The gateway translates
// REST → gRPC internally so callers don't carry a proto runtime.

export interface RestCheckpoint {
  sequenceNumber?: string;  // uint64 over the wire is JSON string
  digest?: string;
  // Other fields (summary, signature, contents, transactions, objects)
  // pass through opaquely; consumers who need them can request the
  // relevant read_mask paths and decode with @mysten/sui's
  // checkpoint types.
  [extra: string]: unknown;
}
