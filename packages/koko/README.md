# @unconfirmed/koko

Sui SDK client extension that surfaces Koko's vendor RPC methods. v0.0.1 ships `getCheckpoint` against the historical archive; batch reads land once the Bundle/SigV4 plumbing is in place.

## Install

```bash
bun add @unconfirmed/koko @mysten/sui
```

## Usage

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { koko } from '@unconfirmed/koko';

const client = new SuiGrpcClient({ network: 'mainnet' })
  .$extend(koko({ apiKey: process.env.KOKO_API_KEY! }));

const cp = await client.koko.getCheckpoint({
  sequenceNumber: 100_000n,
  readMask: ['sequenceNumber', 'digest', 'summary'],
});
```

## Standalone use (no SuiClient)

```ts
import { KokoClient } from '@unconfirmed/koko';

const koko = new KokoClient({ apiKey: process.env.KOKO_API_KEY!, network: 'mainnet' });
const cp = await koko.getCheckpoint({ sequenceNumber: 100_000n });
```

## Authentication

Pass your Koko API key (`koko_live_…` for mainnet, `koko_test_…` for testnet) as `apiKey`. The extension sets `Authorization: Bearer <key>` on every request.
