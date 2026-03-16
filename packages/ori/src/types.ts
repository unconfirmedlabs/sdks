// Copyright (c) Unconfirmed Labs, LLC
// SPDX-License-Identifier: MIT

/** Reference to data stored on Walrus — either a standalone blob or a quilt patch. */
export type WalrusData =
  | { type: "Blob"; blobId: string }
  | { type: "QuiltPatch"; quiltId: string; version: number; startIndex: number; endIndex: number };
