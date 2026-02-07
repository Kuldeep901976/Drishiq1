// lib/utils/fetchWithTimeout.ts

export type FetchWithTimeoutOptions = {
  timeoutMs?: number;
  retries?: number;
  backoffBaseMs?: number;
  retryOn?: (err: any, attempt: number) => boolean;
  fetchImpl?: typeof fetch;
};

export class RequestTimeoutError extends Error {
  public readonly timeoutMs?: number;
  constructor(message = 'Request timed out', timeoutMs?: number) {
    super(message);
    this.name = 'RequestTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, opts: FetchWithTimeoutOptions = {}) {
  const {
    timeoutMs = 10000,
    retries = 1,
    backoffBaseMs = 300,
    retryOn,
    fetchImpl = (globalThis as any).fetch
  } = opts;

  if (!fetchImpl) {
    throw new Error('No fetch available (pass fetchImpl in options).');
  }

  let attempt = 0;

  while (true) {
    attempt += 1;
    let timeoutTriggered = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      timeoutTriggered = true;
      try { controller.abort(); } catch (_) {}
    }, timeoutMs);

    // Merge caller's signal if any
    const callerSignal = (init as any).signal as AbortSignal | undefined;
    let signalToUse: AbortSignal = controller.signal;
    if (callerSignal) {
      if (callerSignal.aborted) {
        clearTimeout(timeout);
        throw new Error('Request aborted by caller signal');
      }
      const wrapper = new AbortController();
      callerSignal.addEventListener('abort', () => wrapper.abort());
      controller.signal.addEventListener('abort', () => wrapper.abort());
      signalToUse = wrapper.signal;
    }

    try {
      const res = await fetchImpl(input, { ...init, signal: signalToUse });
      clearTimeout(timeout);
      return res;
    } catch (err: any) {
      clearTimeout(timeout);

      const isAbort = err && (err.name === 'AbortError' || (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError'));
      const msg = String(err?.message || err || '');

      // Prioritize timeout detection
      if (timeoutTriggered || isAbort || /timeout|timed out|aborted/i.test(msg)) {
        // Retry if allowed
        if (attempt <= retries && (!retryOn || retryOn(err, attempt))) {
          const backoff = Math.round(backoffBaseMs * Math.pow(2, attempt - 1));
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        throw new RequestTimeoutError('Request timed out. The server is taking longer than expected. Please try again in a moment.', timeoutMs);
      }

      // Network or other errors - consider retry
      const shouldRetry = attempt <= retries && (!retryOn || retryOn(err, attempt));
      if (shouldRetry) {
        const backoff = Math.round(backoffBaseMs * Math.pow(2, attempt - 1));
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      // Not retriable - rethrow
      throw err;
    }
  }
}


