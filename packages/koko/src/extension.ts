// Factory for the `client.$extend(koko())` pattern. Mirrors the
// shape @mysten/walrus uses: returns { name, register }, where
// register receives the parent Sui client.

import { KokoClient } from './client';
import type { KokoClientOptions } from './client';

export interface KokoOptions<Name extends string = 'koko'>
  extends KokoClientOptions {
  /**
   * Property name the extension attaches under on the Sui client.
   * Defaults to `'koko'`, exposed as `client.koko.…`.
   */
  name?: Name;
}

export type KokoExtension<Name extends string = 'koko'> = {
  name: Name;
  register: (client: { network?: string }) => KokoClient;
};

export function koko<const Name extends string = 'koko'>(
  options: KokoOptions<Name> = {},
): KokoExtension<Name> {
  const { name = 'koko' as Name, ...clientOptions } = options;
  return {
    name,
    register: (client) =>
      new KokoClient({
        ...clientOptions,
        network:
          clientOptions.network ??
          (clientOptions.baseUrl
            ? undefined
            : (client.network as 'mainnet' | 'testnet' | undefined)),
      }),
  };
}
