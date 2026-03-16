// Copyright (c) Unconfirmed Labs, LLC
// SPDX-License-Identifier: MIT

import { z } from "zod/v4";
import type { WalrusData } from "./types.ts";

/**
 * Zod schema that parses on-chain WalrusData enum JSON into the TypeScript WalrusData type.
 *
 * On-chain, `WalrusData` is a Move enum with two variants:
 * - `Blob(u256)` — serializes as `{ "@variant": "Blob", pos0: "<u256>" }`
 * - `QuiltPatch(u256, u8, u16, u16)` — serializes as `{ "@variant": "QuiltPatch", pos0, pos1, pos2, pos3 }`
 */
export const WalrusDataSchema: z.ZodType<WalrusData> = z.discriminatedUnion("@variant", [
  z
    .object({
      "@variant": z.literal("Blob"),
      pos0: z.string(),
    })
    .transform((data): WalrusData => ({
      type: "Blob",
      blobId: data.pos0,
    })),
  z
    .object({
      "@variant": z.literal("QuiltPatch"),
      pos0: z.string(),
      pos1: z.number(),
      pos2: z.number(),
      pos3: z.number(),
    })
    .transform((data): WalrusData => ({
      type: "QuiltPatch",
      quiltId: data.pos0,
      version: data.pos1,
      startIndex: data.pos2,
      endIndex: data.pos3,
    })),
]) as unknown as z.ZodType<WalrusData>;
