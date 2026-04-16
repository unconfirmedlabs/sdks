import type { Transaction, BuildTransactionOptions } from '@mysten/sui/transactions'
import type { Signer } from '@mysten/sui/cryptography'
import { toBase64 } from '@mysten/sui/utils'
import { OnaraError } from './errors'
import type {
  StatusResponse,
  PolicyConfig,
  SponsorOptions,
  SponsorResponse,
  SponsorEvent,
  TransactionStatusResponse,
  OnaraErrorResponse,
} from './types'

export interface OnaraClientOptions {
  url: string
  fetch?: typeof fetch
}

export class OnaraClient {
  private readonly baseUrl: string
  private readonly fetch: typeof fetch

  constructor(options: string | OnaraClientOptions) {
    if (typeof options === 'string') {
      this.baseUrl = options.replace(/\/+$/, '')
      this.fetch = globalThis.fetch
    } else {
      this.baseUrl = options.url.replace(/\/+$/, '')
      this.fetch = options.fetch ?? globalThis.fetch
    }
  }

  async status(): Promise<StatusResponse> {
    const res = await this.fetch(`${this.baseUrl}/status`)
    if (!res.ok) {
      const body = (await res.json()) as OnaraErrorResponse
      throw new OnaraError(body.error, res.status)
    }
    return res.json() as Promise<StatusResponse>
  }

  async policies(): Promise<PolicyConfig[]> {
    const res = await this.fetch(`${this.baseUrl}/policies`)
    if (!res.ok) {
      const body = (await res.json()) as OnaraErrorResponse
      throw new OnaraError(body.error, res.status)
    }
    return res.json() as Promise<PolicyConfig[]>
  }

  async sponsor(options: SponsorOptions): Promise<SponsorResponse> {
    const params = new URLSearchParams()
    if (options.dryRun) params.set('dryRun', 'true')
    if (options.waitForExecution === false) params.set('waitForExecution', 'false')
    if (options.simulate === false) params.set('simulate', 'false')

    const query = params.toString()
    const url = `${this.baseUrl}/sponsor${query ? `?${query}` : ''}`

    const res = await this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: options.sender,
        txBytes: options.txBytes,
        txSignature: options.txSignature,
      }),
    })

    if (!res.ok) {
      const body = (await res.json()) as OnaraErrorResponse
      throw new OnaraError(body.error, res.status, {
        digest: body.digest,
        txStatus: body.status,
      })
    }

    return res.json() as Promise<SponsorResponse>
  }

  async sponsorTransaction(options: {
    transaction: Transaction
    signer: Signer
    client: NonNullable<BuildTransactionOptions['client']>
    dryRun?: boolean
    waitForExecution?: boolean
    simulate?: boolean
  }): Promise<SponsorResponse> {
    const { transaction, signer, client, dryRun, waitForExecution, simulate } = options

    const { address } = await this.status()

    transaction.setSender(signer.toSuiAddress())
    transaction.setGasOwner(address)

    const bytes = await transaction.build({ client })
    const { signature } = await signer.signTransaction(bytes)

    return this.sponsor({
      sender: signer.toSuiAddress(),
      txBytes: toBase64(bytes),
      txSignature: signature,
      dryRun,
      waitForExecution,
      simulate,
    })
  }

  // ─── Transaction status lookup ────────────────────────────────────────────

  async getTransactionStatus(digest: string): Promise<TransactionStatusResponse> {
    const res = await this.fetch(`${this.baseUrl}/sponsor/${digest}/status`)
    return res.json() as Promise<TransactionStatusResponse>
  }

  // ─── WebSocket sponsorship ────────────────────────────────────────────────

  async *sponsorWs(options: SponsorOptions): AsyncGenerator<SponsorEvent> {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/sponsor/ws'
    const ws = new WebSocket(wsUrl)

    // Wait for open
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new OnaraError('WebSocket connection failed', 0))
    })

    // Send the request
    ws.send(JSON.stringify({
      sender: options.sender,
      txBytes: options.txBytes,
      txSignature: options.txSignature,
      simulate: options.simulate,
      waitForExecution: options.waitForExecution,
    }))

    // Yield events until close
    const events: SponsorEvent[] = []
    let done = false
    let resolveNext: (() => void) | null = null

    ws.onmessage = (evt) => {
      events.push(JSON.parse(typeof evt.data === 'string' ? evt.data : '{}'))
      resolveNext?.()
    }
    ws.onclose = () => { done = true; resolveNext?.() }
    ws.onerror = () => { done = true; resolveNext?.() }

    try {
      while (!done || events.length > 0) {
        if (events.length > 0) {
          const event = events.shift()!
          if (event.status === 'error') {
            throw new OnaraError(event.error ?? 'Unknown error', 0, { digest: event.digest })
          }
          yield event
        } else {
          await new Promise<void>(r => { resolveNext = r })
        }
      }
    } finally {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }

  async *sponsorTransactionWs(options: {
    transaction: Transaction
    signer: Signer
    client: NonNullable<BuildTransactionOptions['client']>
    simulate?: boolean
    waitForExecution?: boolean
  }): AsyncGenerator<SponsorEvent> {
    const { transaction, signer, client, simulate, waitForExecution } = options

    const { address } = await this.status()

    transaction.setSender(signer.toSuiAddress())
    transaction.setGasOwner(address)

    const bytes = await transaction.build({ client })
    const { signature } = await signer.signTransaction(bytes)

    yield* this.sponsorWs({
      sender: signer.toSuiAddress(),
      txBytes: toBase64(bytes),
      txSignature: signature,
      simulate,
      waitForExecution,
    })
  }
}
