export class KokoError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'KokoError';
  }

  static async fromResponse(resp: Response, operation: string): Promise<KokoError> {
    let body: unknown;
    try {
      body = await resp.json();
    } catch {
      body = await resp.text().catch(() => undefined);
    }
    const payload =
      body && typeof body === 'object' && 'error' in body
        ? (body as { error: { code?: string; message?: string } }).error
        : undefined;
    return new KokoError(
      payload?.code ?? `HTTP_${resp.status}`,
      payload?.message ?? `${operation}: HTTP ${resp.status}`,
      resp.status,
      body,
    );
  }

  static fromUnknown(e: unknown, operation: string): KokoError {
    if (e instanceof KokoError) return e;
    const message = e instanceof Error ? e.message : String(e);
    return new KokoError('UNKNOWN', `${operation}: ${message}`, undefined, e);
  }
}
